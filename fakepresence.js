const { Module } = require('../main');
const config = require require('../config');
const isPrivateBot = config.MODE !== 'public';

// --- State Management ---
// Tracks which chat (jid) has an active fake status: { jid: 'typing' | 'recording' }
const activePresence = new Map(); 

/*
NOTE: client.sendPresenceUpdate is the placeholder API function.
*/

// --- Combined Fake Presence Module ---
Module({
    // pattern will capture either "type" or "record" (match[1]) and "on" or "off" (match[2])
    pattern: 'fake(type|record) (on|off)', 
    fromMe: isPrivateBot,
    desc: 'Toggles fake typing or recording status on/off in the chat.',
    type: 'utility'
}, async (message, match) => {
    const jid = message.jid;
    const action = match[1]; // 'type' or 'record'
    const status = match[2]; // 'on' or 'off'
    
    // The status string required by the bot API
    const statusType = (action === 'type' ? 'typing' : 'recording'); 
    
    // --- ON Logic ---
    if (status === 'on') {
        if (activePresence.has(jid)) {
            // Block attempt to turn on when another status is already active
            const currentStatus = activePresence.get(jid);
            if (currentStatus === statusType) {
                return await message.sendReply(`⚠️ Fake ${action} is already *ON* in this chat.`);
            } else {
                 return await message.sendReply(`❌ Cannot start fake ${action}. Please use \`*.fake${currentStatus} off*\` first.`);
            }
        }
        
        try {
            // 1. Send the presence update (e.g., 'typing' or 'recording')
            await message.client.sendPresenceUpdate(jid, statusType);
            
            // 2. Update state map
            activePresence.set(jid, statusType);

            return await message.sendReply(`✅ Fake ${action} status is now *ON*.\nUse \`*.fake${action} off*\` to stop it.`);

        } catch (error) {
            console.error(`Error sending fake ${action} presence:`, error);
            return await message.sendReply(`❌ Failed to send fake ${action} status. Check API implementation.`);
        }
    } 

    // --- OFF Logic ---
    else if (status === 'off') {
        if (!activePresence.has(jid)) {
            return await message.sendReply(`❌ Fake presence status is not active in this chat.`);
        }
        
        if (activePresence.get(jid) !== statusType) {
             // Block turning off the wrong status
             const currentStatus = activePresence.get(jid);
             return await message.sendReply(`❌ Cannot turn *OFF* fake ${action}. The current active status is *${currentStatus}*. Use \`*.fake${currentStatus} off*\`.`);
        }
        
        try {
            // 1. Send 'available' to clear any active status
            await message.client.sendPresenceUpdate(jid, 'available'); 
            
            // 2. Clear state map
            activePresence.delete(jid);
            
            return await message.sendReply(`✅ Fake ${action} status is now *OFF*.`);

        } catch (error) {
            console.error(`Error clearing fake ${action} presence:`, error);
            return await message.sendReply(`❌ Failed to clear fake ${action} status.`);
        }
    }
});
