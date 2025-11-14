// --- REQUIRED MODULES AND CONFIGURATION ---
const { Module } = require("../main");
// No external config or APIs are needed for this module!

// --- Magic 8-Ball Responses ---
const responses = [
    // Positive Answers
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes — definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",

    // Non-committal Answers
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",

    // Negative Answers
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];

// --- Command Module Definition (.8ball) ---
Module(
    {
        pattern: "8ball(.*)",
        fromMe: true,
        desc: "Ask the Magic 8-Ball a yes/no question.",
        usage: '.8ball <your question>?',
    },
    async (message, match) => {
        const question = match[1]?.trim();
        
        if (!question || question.length < 5) {
            return await message.sendReply("🔮 **Magic 8-Ball:** Please ask me a question! \nUsage: `.8ball Will I get rich next year?`");
        }
        
        // 1. Send an initial 'shaking' message
        const waitingMessage = await message.sendReply("🔮 *Shaking the Magic 8-Ball...*");
        
        // 2. Safely extract the message key for editing
        // This is the critical fix: We check for key/id properties that are usually present.
        const messageKey = waitingMessage?.key || waitingMessage?.id; 

        // 3. Select a random response
        const randomIndex = Math.floor(Math.random() * responses.length);
        const answer = responses[randomIndex];
        
        // 4. Format the final reply
        const finalReply = 
            `*You asked:* ${question}\n\n` +
            `🎱 *The Magic 8-Ball says:* **${answer}**`;
        
        // 5. Edit the message using the safely extracted key
        if (messageKey) {
            return await message.edit(finalReply, messageKey);
        } else {
            // Fallback: If we couldn't get the key, send the final reply as a new message
            return await message.sendReply(finalReply);
        }
    }
);
