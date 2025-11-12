const { Module } = require('../main');
const axios = require('axios');
const botConfig = require("../config");
const isFromMe = botConfig.MODE === "public" ? false : true;

let pendingSpotify = {};

// --- Helper function to extract Spotify Track ID from URL ---
function getSpotifyTrackId(url) {
    // Regex to find the 22-character ID in the track URL
    const match = url.match(/(?:track\/|t=)([a-zA-Z0-9]{22})/);
    return match ? match[1] : null;
}

// --- CORE DOWNLOAD FUNCTION (Replaces the old API call) ---
async function downloadTrackBySpotifyId(message, trackId, updateKey) {
    
    // 1. Get Download Link (The new 320kbps API)
    const downloadRes = await axios.get(`https://api.spotifydown.com/download/${trackId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const dl = downloadRes.data;

    if (!dl.success || !dl.link) {
        throw new Error('New API failed to provide a high-quality download link.');
    }

    // 2. Stream the Audio File
    await message.edit(`⬇️ Downloading: *${dl.metadata.title}* - ${dl.metadata.artist}`, message.jid, updateKey);

    const response = await axios.get(dl.link, { 
        responseType: 'stream',
        headers: { 'User-Agent': 'Mozilla/5.0' } // Use a common user agent to avoid blocking
    });

    // 3. Send the Message
    await message.sendMessage(
        { stream: response.data },
        "audio",
        {
            mimetype: "audio/mpeg",
            quoted: message.data,
            fileName: `${dl.metadata.title} - ${dl.metadata.artist}.mp3`
        }
    );

    return { title: dl.metadata.title, artist: dl.metadata.artist };
}

// --- Main SPOTIFY Command Module ---
Module({
    pattern: 'spotify ?(.*)',
    fromMe: isFromMe,
    desc: 'Search & Download Spotify songs (320kbps quality).',
    type: 'downloader'
}, async (message, match) => {
    let query = match[1]?.trim();

    if (!query && message.reply_message) {
        query = message.reply_message.text?.trim();
    }

    if (!query) return await message.sendReply('_Give me a song name or Spotify URL!_');

    // --- Direct URL Download (NEW LOGIC) ---
    const trackId = getSpotifyTrackId(query);
    if (query.startsWith('http') && trackId) {
        try {
            const waitMsg = await message.sendReply('⬇️ Fetching track info and downloading (High Quality)...');
            
            const trackInfo = await downloadTrackBySpotifyId(message, trackId, waitMsg.key);

            await message.edit(`✅ Success: *${trackInfo.title}* - ${trackInfo.artist}`, message.jid, waitMsg.key);

        } catch (err) {
            console.error('Direct Download Error:', err);
            return await message.sendReply('_Error downloading track (New API failed)!_');
        }
        return;
    }

    // --- Search Logic (Uses new high-quality search API) ---
    try {
        const waitMsg = await message.sendReply(`_Searching for:_ *${query}*`);

        const res = await axios.get(`https://api.spotifydown.com/search?q=${encodeURIComponent(query)}`);
        
        if (!res.data.success || !res.data.results || res.data.results.length === 0) {
            return await message.edit('_No tracks found with the new high-quality API!_', message.jid, waitMsg.key);
        }

        const results = res.data.results.slice(0, 8);
        let list = results.map((t, i) =>
            `*${i + 1}. ${t.title}*\n_by ${t.artists} • ${Math.floor(t.duration / 1000)} seconds_`
        ).join("\n\n");

        await message.edit(
            `🎵 *Search results for:* _"${query}"_\n\n${list}\n\n_Reply with a number (1–${results.length}) to download_`,
            message.jid,
            waitMsg.key
        );

        pendingSpotify[message.sender] = { key: waitMsg.key, results };

    } catch (err) {
        console.error('Search Error:', err);
        return await message.sendReply('_Error fetching search results (New API failed)!_');
    }
});

// --- Move Handler Module (Updated Download Logic) ---
Module({
    on: 'text',
    fromMe: false
}, async (message) => {
    const userState = pendingSpotify[message.sender];
    if (!userState) return;

    const selected = parseInt(message.message.trim());
    if (isNaN(selected) || selected < 1 || selected > userState.results.length) return;

    const track = userState.results[selected - 1];
    delete pendingSpotify[message.sender];

    try {
        const trackInfo = await downloadTrackBySpotifyId(message, track.id, userState.key);
        
        await message.edit(`✅ Success: *${trackInfo.title}* - ${trackInfo.artist}`, message.jid, userState.key);

    } catch (err) {
        console.error('Selected Download Error:', err);
        await message.edit('_Error downloading the selected track!_', message.jid, userState.key);
    }
});
