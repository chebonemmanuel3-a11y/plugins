// Remove all initial 'require' statements

// --- State Management ---
// Tracks which chat (jid) has an active fake status: { jid: 'composing' | 'recording' }
const activePresence = new Map(); 

// --- Bot API Presence Types ---
const TYPE_COMPOSE = 'composing'; // Used for typing
const TYPE_RECORD = 'recording';  // Used for recording
const TYPE_AVAILABLE = 'available'; // Used to clear status

// --- Combined Fake Presence Module ---
Module({
    // pattern will capture either "type" or "record" (match[1]) and "on" or "off" (match[2])
    pattern: 'fake(type|record) (on|off)', 
    // Setting fromMe to false, assuming the bot is for public use, since config failed.
    fromMe: false, 
    desc: 'Toggles fake typing or recording status on/off in the chat.',
    type: 'utility'
}, async (message, match) => {
    const jid = message.jid;
    const action = match[1]; // 'type' or 'record'
    const status = match[2]; // 'on' or 'off'
    
    // Determine the correct API string based on the command action
    const statusType = (action === 'type' ? TYPE_COMPOSE : TYPE_RECORD); 
    
    // --- ON Logic ---
    if (status === 'on') {
        if (activePresence.has(jid)) {
            const currentStatus = activePresence.get(jid);
            // Re-map the API string back to the command word for user feedback
            const currentAction = (currentStatus === TYPE_COMPOSE ? 'type' : 'record');
            
            if (currentStatus === statusType) {
                return await message.sendReply(`⚠️ Fake ${action} is already *ON* in this chat.`);
            } else {
                 return await message.sendReply(`❌ Cannot start fake ${action}. Please use \`*.fake${currentAction} off*\` first.`);
            }
        }
        
        try {
            // 1. Send the presence update
            await message.client.sendPresenceUpdate(statusType, jid);
            activePresence.set(jid, statusType);

            return await message.sendReply(`✅ Fake ${action} status is now *ON*.\nUse \`*.fake${action} off*\` to stop it.`);

        } catch (error) {
            console.error(`Error sending fake ${action} presence:`, error);
            return await message.sendReply(`❌ Failed to send fake ${action} status.`);
        }
    } 

    // --- OFF Logic ---
    else if (status === 'off') {
        if (!activePresence.has(jid)) {
            return await message.sendReply(`❌ Fake presence status is not active in this chat.`);
        }
        
        if (activePresence.get(jid) !== statusType) {
             const currentStatus = activePresence.get(jid);
             const currentAction = (currentStatus === TYPE_COMPOSE ? 'type' : 'record');
             return await message.sendReply(`❌ Cannot turn *OFF* fake ${action}. The current active status is *${currentAction}*. Use \`*.fake${currentAction} off*\`.`);
        }
        
        try {
            // 1. Send 'available' to clear any active status
            await message.client.sendPresenceUpdate(TYPE_AVAILABLE, jid); 
            activePresence.delete(jid);
            
            return await message.sendReply(`✅ Fake ${action} status is now *OFF*.`);

        } catch (error) {
            console.error(`Error clearing fake ${action} presence:`, error);
            return await message.sendReply(`❌ Failed to clear fake ${action} status.`);
        }
    }
});
