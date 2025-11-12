// vo_reply.js — View Once Extractor triggered by Reply (.vo)

const { Module } = require('../main');
const botConfig = require("../config"); 

// --- Configuration Setup ---
// Get the JID for sending the private message (Owner's full JID)
// Adjust this line if your owner JID is stored differently
const OWNER_JID = botConfig.OWNER_JID || "YOUR_OWNER_NUMBER@s.whatsapp.net"; 

// Helper to check if the sender is authorized (Security check)
function isSudo(senderId) {
    const SUDO_NUMBERS = botConfig.SUDO ? botConfig.SUDO.split(',').map(s => s.trim()) : [];
    const senderNumber = senderId.split('@')[0];
    return SUDO_NUMBERS.includes(senderNumber);
}
// ----------------------------


Module({
    pattern: 'vo',
    fromMe: false, // Can be triggered by anyone
    desc: 'Extracts and sends View Once media (Image/Video) from the replied message to the Owner\'s DM.',
    type: 'utility'
}, async (message) => {
    
    const client = message.client;
    
    // ⚠️ Security Check: Only authorized users can execute this command
    if (!isSudo(message.sender)) {
        return await message.sendReply('❌ This command is restricted to bot owners (SUDO users).');
    }

    // 1. Check if the command is a reply to a message
    if (!message.reply_message) {
        return await message.sendReply('❌ Reply to a *View Once* message with *.vo* to extract the media.');
    }
    
    // 2. Check if the replied message is a View Once wrapper
    const repliedMsg = message.reply_message;
    if (repliedMsg.mtype !== 'viewOnceMessage') {
        return await message.sendReply('❌ The replied message is not a *View Once* message.');
    }
    
    // 3. Access the inner media message
    const innerMessage = repliedMsg.message.viewOnceMessage.message;
    
    let mediaType;
    if (innerMessage.imageMessage) {
        mediaType = 'image';
    } else if (innerMessage.videoMessage) {
        mediaType = 'video';
    } else {
        return await message.sendReply('❌ The View Once message contains unsupported media (only Image/Video are supported).');
    }
    
    // Get sender info from the original VO message
    const originalSenderName = repliedMsg.pushName || "Unknown User";
    const originalSenderJid = repliedMsg.sender;

    await message.sendReply(`👀 Extracting View Once ${mediaType} from ${originalSenderName}...`);

    try {
        // 4. Download the media buffer from the inner message object
        const mediaBuffer = await client.downloadMediaMessage(innerMessage);
        
        // 5. Re-send the media to the OWNER_JID (Your DM)
        const captionText = `✅ *Extracted View Once ${mediaType}*\nSent by: ${originalSenderName} (${originalSenderJid.split('@')[0]})`;
        
        await client.sendMessage(
            OWNER_JID, // *** Sending to Owner's DM ***
            { 
                [mediaType]: mediaBuffer, 
                caption: captionText,
            }
        );

        // Notify the group/chat that the extraction was successful
        await message.edit(`✅ Extracted and sent the media to your DM.`, message.jid, message.key);


    } catch (error) {
        console.error(`VO Reply Extractor Error for ${mediaType}:`, error);
        await message.sendReply(`❌ Failed to extract View Once ${mediaType}. The message might have expired or the API failed.`);
    }
});
- Search Logic (REVERTS TO OLD, RELIABLE SEARCH API) ---
    try {
        const waitMsg = await message.sendReply(`_Searching for:_ *${query}*`);

        // Use the old, reliable search endpoint
        const res = await axios.get(`${OLD_SEARCH_API}?search=${encodeURIComponent(query)}`);
        
        if (!res.data.tracks || res.data.tracks.length === 0) {
            return await message.edit('_No tracks found!_', message.jid, waitMsg.key);
        }

        const results = res.data.tracks.slice(0, 8);
        
        let list = results.map((t, i) =>
            // IMPORTANT: The search results from the old API include the track's Spotify URL,
            // which we need to save for the download step.
            `*${i + 1}. ${t.trackName}*\n_by ${t.artist} • ${t.durationMs}_`
        ).join("\n\n");

        await message.edit(
            `🎵 *Search results for:* _"${query}"_\n\n${list}\n\n_Reply with a number (1–${results.length}) to download_`,
            message.jid,
            waitMsg.key
        );

        // Store the full results (including spotifyUrl) for the next step
        pendingSpotify[message.sender] = { key: waitMsg.key, results };

    } catch (err) {
        console.error('Search Error:', err);
        return await message.sendReply('_Error fetching search results (Old API failed)!_');
    }
});

// --- Selection Handler Module (Updated Download Logic) ---
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
    
    // Get the Spotify ID from the URL saved in the search result
    const trackId = getSpotifyTrackId(track.spotifyUrl);

    if (!trackId) {
        await message.edit('_Error: Could not find track ID for download!_', message.jid, userState.key);
        return;
    }

    try {
        // Use the NEW high-quality download function
        const trackInfo = await downloadTrackBySpotifyId(message, trackId, userState.key);
        
        await message.edit(`✅ Success: *${trackInfo.title}* - ${trackInfo.artist}`, message.jid, userState.key);

    } catch (err) {
        console.error('Selected Download Error:', err);
        await message.edit('_Error downloading the selected track!_', message.jid, userState.key);
    }
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
