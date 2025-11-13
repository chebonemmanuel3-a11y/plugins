const { Module } = require('../main');
const config = require('../config');
const axios = require('axios');

// Helper: Check if user is admin (for use in other plugins)
async function isUserAdmin(message, userJid) {
    if (!message.isGroup) return false;
    try {
        const groupMetadata = await message.client.groupMetadata(message.jid);
        const participant = groupMetadata.participants.find(p => p.id === userJid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (error) {
        return false;
    }
}

const isPrivateBot = config.MODE !== 'public';

Module({
    pattern: 'whois ?(.*)',
    fromMe: isPrivateBot,
    desc: 'Get detailed user information',
    type: 'utility'
}, async (message, match) => {
    try {
        let userJid;
        let userName = 'Unknown';
        let userStatus = 'Not available';
        let profilePicUrl = null;
        let phoneNumber = 'Unknown';
        let groupRole = 'Member';

        if (message.reply_message && message.reply_message.jid) {
            userJid = message.reply_message.jid;
        } else if (match[1] && match[1].trim()) {
            let input = match[1].trim();
                        
            if (input.includes('@')) {
                // Handle mentions within the input text
                const mentions = message.message.match(/@(\d+)/g);
                if (mentions && mentions.length > 0) {
                    input = mentions[0].replace('@', '');
                } else {
                    input = input.replace('@', '');
                }
            }
                        
            if (input.includes('@s.whatsapp.net')) {
                userJid = input;
            } else if (/^\d+$/.test(input)) {
                userJid = input + '@s.whatsapp.net';
            } else {
                const numberMatch = input.match(/\d+/);
                if (numberMatch) {
                    userJid = numberMatch[0] + '@s.whatsapp.net';
                } else {
                    return await message.sendReply('.\n\n*Usage:*\n• .whois - Your own info\n• .whois 910000000000 - Someone\'s info\n• Reply to a message + `.whois`');
                }
            }
        } else {
            userJid = message.sender;
        }

        if (!userJid) {
            return await message.sendReply('❌ Unable to identify user! Please try one of these methods:\n\n*Usage:*\n• .whois - Your own info\n• .whois 910000000000 - Get someone\'s info\n• Reply to a message + `.whois`\n• Mention someone + `.whois @username`');
        }

        userJid = userJid.replace('@c.us', '@s.whatsapp.net');
                
        const loadingMsg = await message.sendReply('🔍 Getting user information...');
        phoneNumber = userJid.replace('@s.whatsapp.net', '');

        try {
            const userDetails = await message.client.onWhatsApp(userJid);
            if (!userDetails || userDetails.length === 0) {
                return await message.sendReply('❌ User not found on WhatsApp!');
            }
        } catch (error) {
            // Ignore if not supported
        }

        try {
            profilePicUrl = await message.client.profilePictureUrl(userJid, 'image');
        } catch (error) {
            // Profile pic not available
        }

        // 1. If it's a reply, get name from reply_message
        if (message.reply_message && message.reply_message.jid === userJid) {
            if (message.reply_message.senderName) {
                userName = message.reply_message.senderName;
            }
        }
        
        // 2. Try group participant name
        if (message.isGroup && userName === 'Unknown') {
            try {
                const groupMetadata = await message.client.groupMetadata(message.jid);
                const participant = groupMetadata.participants.find(p => p.id === userJid);
                if (participant) {
                    userName = participant.notify || participant.name || participant.short || userName;
                    if (participant.admin === 'superadmin') groupRole = 'Super Admin';
                    else if (participant.admin === 'admin') groupRole = 'Admin';
                }
            } catch (error) {
                console.log('Group metadata error:', error);
            }
        }

        // 3. If it's own info, use senderName
        if (userJid === message.sender && message.senderName && userName === 'Unknown') {
            userName = message.senderName;
        }

        // 4. Try business profile
        if (userName === 'Unknown') {
            try {
                const businessProfile = await message.client.getBusinessProfile(userJid);
                if (businessProfile && businessProfile.business_name) {
                    userName = businessProfile.business_name;
                }
            } catch (error) {
                // Business profile not available
            }
        }

        // 5. WhatsApp lookup notify
        if (userName === 'Unknown') {
            try {
                const [info] = await message.client.onWhatsApp(userJid);
                if (info && info.notify) userName = info.notify;
            } catch (error) {
                // WhatsApp lookup failed
            }
        }

        try {
            const status = await message.client.fetchStatus(userJid);
            if (status && status.status) userStatus = status.status;
        } catch (error) {
            // Status not available
        }

        let formattedNumber = (phoneNumber !== 'Unknown' && phoneNumber.length > 5)
            ? (phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`)
            : phoneNumber;

        let infoMessage = '📋 User Information\n';
        infoMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        infoMessage += `• *Number:* ${formattedNumber}\n`;
        infoMessage += `• *Name:* ${userName}\n`;
        infoMessage += `• *About:* ${userStatus !== 'Not available' ? userStatus : '_Status not visible_'}\n`;
        if (message.isGroup) infoMessage += `• *Group Role:* ${groupRole}\n`;
        infoMessage += `• *JID:* \`${userJid}\`\n`;
        infoMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
                
        // FIXED: Better context message
        if (userJid === message.sender) {
            infoMessage += '📋 Note: This is your own profile information';
        } else if (message.reply_message) {
            infoMessage += '📋 Info retrieved from replied message';
        } else {
            infoMessage += `📋 _Retrieved at: ${new Date().toLocaleString()}_`;
        }

        // Add the branding line
        const branding = "\n\n_Powered by intirtualemma_";

        if (profilePicUrl) {
            try {
                const response = await axios.get(profilePicUrl, { 
                    responseType: 'stream', 
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'WhatsApp/2.2108.8 Mozilla/5.0'
                    }
                });
                                
                await message.client.sendMessage(message.jid, {
                    image: { stream: response.data },
                    caption: infoMessage + branding // Branding added here
                });
            } catch (error) {
                console.log('Profile picture download error:', error);
                infoMessage += '\n\n📷 Profile Picture: Failed to load';
                await message.sendReply(infoMessage + branding); // Branding added here
            }
        } else {
            infoMessage += '\n\n📷 Profile Picture: Not available';
            await message.sendReply(infoMessage + branding); // Branding added here
        }

    } catch (error) {
        console.error('Whois plugin error:', error);
        await message.sendReply('❌ An error occurred while getting user information. Please try again.\n\n_Powered by intirtualemma_');
    }
});

module.exports = { isUserAdmin };
