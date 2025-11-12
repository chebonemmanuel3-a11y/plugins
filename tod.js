const { Module } = require('../main');
const config = require('../config');
const isPrivateBot = config.MODE !== 'public';

// --- Cooldown Configuration ---
const COOLDOWN_TIME = 30000; // 30 seconds in milliseconds
const cooldowns = new Map(); // Map to store { userId: lastUsedTimestamp }

// Helper to choose a random item from an array
function randomChoice(arr) {
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Data Structure (Truths and Dares lists remain the same) ---
const TRUTHS = [
    "What is the most expensive piece of gear you accidentally broke while enchanting or refining?",
    "Admit one time you secretly stole an MVP/Mini from another player or party.",
    "What's one skill or class ability you secretly think is useless?",
    "What's the absolute lowest amount of Zeny you've ever held at one time?",
    "Which character on your account is secretly your main, even though you tell everyone it's your current one?",
    "What's the most embarrassing way you've died in a high-level area like Endless Tower or Oracle?",
    "Who in the guild (or current chat) do you think needs to change their entire build?"
];

const DARES = [
    "Dare to change your main character's hair color to bright pink for the next 48 hours.",
    "Dare to send a global message saying 'I love Porings!' right now.",
    "Dare to auto-attack a Goblin Archer for 5 minutes in Prontera South Field and screenshot the combat log.",
    "Dare to spend the next 30 minutes farming in an area that gives you 0 experience points.",
    "Dare to unequip all your armor and take a selfie next to an MVP.",
    "Dare to post an absurdly low price item on the Exchange for 5 minutes (e.g., selling a Gold Bar for 1 Zeny).",
    "Dare to use only auto-attacks and no skills during your next 5 daily quests."
];

// --- Module Definition for .tod command ---
Module({
    pattern: 'tod ?(.*)',
    fromMe: isPrivateBot,
    desc: 'Starts a Truth or Dare game. Use: .tod truth or .tod dare',
    type: 'game'
}, async (message, match) => {
    const userId = message.sender;
    const now = Date.now();
    
    // --- COOLDOWN CHECK ---
    if (cooldowns.has(userId)) {
        const lastUsed = cooldowns.get(userId);
        const timeElapsed = now - lastUsed;
        
        if (timeElapsed < COOLDOWN_TIME) {
            const timeLeft = Math.ceil((COOLDOWN_TIME - timeElapsed) / 1000);
            return await message.sendReply(`⏳ You must wait *${timeLeft} seconds* before requesting another Truth or Dare.`);
        }
    }

    const choice = match[1] ? match[1].toLowerCase().trim() : '';

    if (!choice) {
        return await message.sendReply("⚠️ Please specify 'truth' or 'dare'. Example: `*.tod truth*`");
    }

    let selectedItem = null;
    let type = '';

    if (choice === 'truth') {
        type = 'Truth';
        selectedItem = randomChoice(TRUTHS);
    } else if (choice === 'dare') {
        type = 'Dare';
        selectedItem = randomChoice(DARES);
    } else {
        return await message.sendReply(`❌ Invalid choice: *${choice}*. Please use *'truth'* or *'dare'*.`);
    }

    // --- Output & Cooldown Set ---
    if (selectedItem) {
        // Set cooldown AFTER a successful selection
        cooldowns.set(userId, now);

        const responseMessage = `
**🎲 Truth or Dare! 🎲**

*Type:* ${type}
*Player:* @${message.sender.split('@')[0]}

**${type.toUpperCase()}:** ${selectedItem}
        `.trim();

        await message.client.sendMessage(message.jid, { 
            text: responseMessage,
            mentions: [message.sender] 
        });

    } else {
        await message.sendReply(`_Sorry, I don't have any ${type.toLowerCase()} prompts currently. Add some to the data structure!_`);
    }
});

module.exports = {
    TRUTHS,
    DARES
};
