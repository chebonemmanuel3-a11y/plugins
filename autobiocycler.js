const { Module } = require('../main');
const axios = require('axios');

// --- Global State ---
let autoBioInterval = null;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches a random quote and updates the bot's profile status.
 * @param {object} client - The bot client object.
 * @param {function} sendReply - The message.sendReply function for logging.
 */
const updateBio = async (client, sendReply = null) => {
    let newBio = "✨ RagnaBot is online! Use .menu to see commands. ✨"; // Default fallback bio

    try {
        // 1. Fetch random quotes from ZenQuotes API
        const response = await axios.get('https://zenquotes.io/api/random');
        
        // 2. Add robust check: Ensure response.data is an array and has content
        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            const quoteData = response.data[0];
            
            if (quoteData.q && quoteData.a) {
                // Format the new bio: Quote (Q) by Author (A)
                newBio = `${quoteData.q} — ${quoteData.a}`; 
            }
        } else {
            // Log that the API failed but we will use the fallback bio
            console.error('Auto-Bio Cycler: Quote API failed to return valid data.');
        }

        // 3. Update the bot's profile status (Confirmed working function)
        await client.updateProfileStatus(newBio); 
        
        if (sendReply) {
            await sendReply(`✅ Bio updated successfully to:\n\n*${newBio}*`);
        }

    } catch (error) {
        console.error('Auto-Bio Cycler Network/API Error:', error.message);
        
        // If API fails due to network, update bio with the safe fallback text
        await client.updateProfileStatus(newBio); 
        
        if (sendReply) {
            await sendReply(`❌ Failed to fetch new bio (Network/API Error). Using fallback bio.`);
        }
    }
};

// --- Command: .autobio start ---
Module({
    pattern: 'autobio start',
    fromMe: true,
    desc: 'Starts the 5-minute auto-bio update cycle.',
    type: 'utility'
}, async (message) => {
    const client = message.client;
    
    if (autoBioInterval) {
        return await message.sendReply('⚠️ Auto-Bio Cycler is already running.');
    }

    // 1. Run immediately
    await updateBio(client, message.sendReply);
    
    // 2. Set up the interval
    autoBioInterval = setInterval(() => {
        // Background updates, no chat reply
        updateBio(client); 
    }, INTERVAL_MS);

    await message.sendReply(`✅ Auto-Bio Cycler STARTED! Will update every ${INTERVAL_MS / 60000} minutes.`);
});

// --- Command: .autobio stop ---
Module({
    pattern: 'autobio stop',
    fromMe: true,
    desc: 'Stops the auto-bio update cycle.',
    type: 'utility'
}, async (message) => {
    if (!autoBioInterval) {
        return await message.sendReply('⚠️ Auto-Bio Cycler is not currently running.');
    }

    // Clear the interval
    clearInterval(autoBioInterval);
    autoBioInterval = null;

    await message.sendReply('❌ Auto-Bio Cycler STOPPED!');
});
