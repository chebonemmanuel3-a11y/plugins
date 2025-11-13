const { Module, jidNormalizedUser } = require('../main'); // Correct way to import
const config = require("../config");
const axios = require('axios');
const isPrivateBot = config.MODE !== 'public';

Module({
    pattern: 'whois ?(.*)',
    fromMe: isPrivateBot, // Use the config variable
    desc: 'Fetches profile information for a user.',
    type: 'utility'
}, async (message, match) => {

    let jid;

    // Check if the command is a reply
    if (message.reply_message) {
        jid = message.reply_message.sender;
    } 
    // Check if a user is mentioned
    else if (message.mention.length > 0) {
        jid = message.mention[0];
    } 
    // Check if a JID/number is provided in the command
    else if (match[1]) {
        let text = match[1].replace(/[^0-9]/g, ''); // Clean the input
        jid = text + '@s.whatsapp.net';
    } 
    // If no target, check the user who sent the command
    else {
        jid = message.sender;
    }

    // Ensure the JID is valid before proceeding
    try {
        // Use the jidNormalizedUser function imported from main
        jid = jidNormalizedUser(jid);
    } catch (e) {
        return await message.sendReply("Invalid user ID. Please reply to a user, tag them, or provide their phone number.");
    }

    try {
        // Fetch the profile picture URL
        const ppUrl = await message.client.profilePictureUrl(jid, 'image');

        // Fetch the "About" (status)
        const status = await message.client.fetchStatus(jid);
        
        // Get the name associated with the user
        const userInfo = await message.client.getContactInfo(jid);
        const name = userInfo.name || userInfo.notify || userInfo.short || jid.split('@')[0];

        let caption = `*👤 User Information*\n\n`;
        caption += `*Name:* ${name}\n`;
        caption += `*About:* ${status.status || '_No about status set._'}\n`;
        caption += `*JID:* ${jid}`;

        // Send the profile picture with the info as a caption
        await message.sendReply(
            { url: ppUrl }, 
            { caption: caption, quoted: message.data }, 
            'image'
        );

    } catch (error) {
        console.error("Whois Error:", error);

        // Fallback if the profile picture fetch fails (e.g., user has no DP)
        try {
            const status = await message.client.fetchStatus(jid);
            const userInfo = await message.client.getContactInfo(jid);
            const name = userInfo.name || userInfo.notify || userInfo.short || jid.split('@')[0];

            let caption = `*👤 User Information*\n\n`;
            caption += `*Name:* ${name}\n`;
            caption += `*About:* ${status.status || '_No about status set._'}\n`;
            caption += `*JID:* ${jid}\n\n`;
            caption += `_Could not fetch profile picture (it may be private or not set)._`;
            
            await message.sendReply(caption);
        } catch (e) {
            await message.sendReply("❌ Could not retrieve information for this user.");
        }
    }
});
