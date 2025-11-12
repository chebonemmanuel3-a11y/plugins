const { Module } = require('../main');
const axios = require('axios');

// --- Global State ---
let autoBioInterval = null;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches a random quote and updates the bot's profile status.
 * @param {object} client - The bot client object (from the message object).
 * @param {function} sendReply - The message.sendReply function for logging.
 */
const updateBio = async (client, sendReply = null) => {
    try {
        // 1. Fetch random quotes from ZenQuotes API
        const response = await axios.get('https://zenquotes.io/api/random');
        
        // ZenQuotes API returns an array, typically with one quote object
        const quoteData = response.data[0];
        
        if (!quoteData || !quoteData.q) {
            throw new Error("Invalid response structure from quote API.");
        }
        
        // Format the new bio: Quote (Q) by Author (A)
        const newBio = `${quoteData.q} — ${quoteData.a}`; 
        
        // 2. Update the bot's profile status (Confirmed working function)
        await client.updateProfileStatus(newBio); 
        
        if (sendReply) {
            await sendReply(`✅ Bio updated successfully to:\n\n*${newBio}*`);
        }

    } catch (error) {
        console.error('Auto-Bio Cycler Error:', error.message);
        if (sendReply) {
            await sendReply(`❌ Failed to update bio. Check console for details.`);
        }
        // In a real bot, you might add logic here to retry or stop the interval 
        // if the API is failing repeatedly.
    }
};

// --- Command: .autobio start ---
Module({
    pattern: 'autobio start',
    fromMe: true, // Owner-only command
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
        // Note: We cannot pass message.sendReply here as it is tied to a specific chat,
        // so we just call the core function for background updates.
        updateBio(client); 
    }, INTERVAL_MS);

    await message.sendReply(`✅ Auto-Bio Cycler STARTED! Will update every ${INTERVAL_MS / 60000} minutes.`);
});

// --- Command: .autobio stop ---
Module({
    pattern: 'autobio stop',
    fromMe: true, // Owner-only command
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

// --- Startup Logic (Optional but recommended) ---
// If your framework has a way to run code on startup, 
// you can automatically run the 'start' command here. 
// For now, this is left out, assuming you will manually run .autobio start.
