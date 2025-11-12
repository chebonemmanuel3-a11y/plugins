const { Module } = require('../main');
const config = require('../config');
const isPrivateBot = config.MODE !== 'public';

// --- Configuration (UPDATED TO 20 SECONDS) ---
const DURATION = 20000; // 20 seconds in milliseconds
const TYPING_DURATION = DURATION; 
const RECORDING_DURATION = DURATION; 

// --- 1. Fake Typing Command ---
Module({
    pattern: 'fake type',
    fromMe: isPrivateBot,
    desc: 'Displays the "Typing..." status for 20 seconds.',
    type: 'utility'
}, async (message, match) => {
    const jid = message.jid;

    await message.sendReply(`✅ Initiating fake typing status for ${DURATION / 1000} seconds...`); 
    
    try {
        // 1. Send the 'typing' status update
        await message.client.sendPresenceUpdate(jid, 'typing'); 

        // 2. Automatically clear the status after the duration
        setTimeout(async () => {
            await message.client.sendPresenceUpdate(jid, 'available'); // Clears the status
            // Optional: send a message to confirm it ended, if needed for debugging/user feedback
            // await message.sendReply("Typing status cleared."); 
        }, TYPING_DURATION);

    } catch (error) {
        console.error("Error sending fake typing presence:", error);
        await message.sendReply("❌ Failed to send typing status. Check API documentation.");
    }
});

// --- 2. Fake Recording Command ---
Module({
    pattern: 'fake record',
    fromMe: isPrivateBot,
    desc: 'Displays the "Recording..." status for 20 seconds.',
    type: 'utility'
}, async (message, match) => {
    const jid = message.jid;

    await message.sendReply(`✅ Initiating fake recording status for ${DURATION / 1000} seconds...`); 
    
    try {
        // 1. Send the 'recording' status update
        await message.client.sendPresenceUpdate(jid, 'recording'); 

        // 2. Automatically clear the status after the duration
        setTimeout(async () => {
            await message.client.sendPresenceUpdate(jid, 'available'); // Clears the status
        }, RECORDING_DURATION);

    } catch (error) {
        console.error("Error sending fake recording presence:", error);
        await message.sendReply("❌ Failed to send recording status. Check API documentation.");
    }
});
