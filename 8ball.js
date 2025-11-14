const { Module } = require('../main');

// --- Magic 8-Ball Responses ---
const EIGHT_BALL_RESPONSES = [
  "🎱 It is certain.",
  "🎱 Without a doubt.",
  "🎱 Yes – definitely.",
  "🎱 You may rely on it.",
  "🎱 As I see it, yes.",
  "🎱 Most likely.",
  "🎱 Outlook good.",
  "🎱 Yes.",
  "🎱 Signs point to yes.",
  "🎱 Reply hazy, try again.",
  "🎱 Ask again later.",
  "🎱 Better not tell you now.",
  "🎱 Cannot predict now.",
  "🎱 Concentrate and ask again.",
  "🎱 Don't count on it.",
  "🎱 My reply is no.",
  "🎱 My sources say no.",
  "🎱 Outlook not so good.",
  "🎱 Very doubtful."
];

// --- 8Ball Command Module ---
Module({
  pattern: '8ball ?(.*)',
  fromMe: false,
  desc: 'Ask the Magic 8-Ball a question',
  type: 'fun'
}, async (message, match) => {
  const question = match[1]?.trim();

  if (!question) {
    return await message.sendReply("❓ Ask me a question! Example: `.8ball Will I win today?`");
  }

  // Pick a random response
  const response = EIGHT_BALL_RESPONSES[Math.floor(Math.random() * EIGHT_BALL_RESPONSES.length)];

  const replyText = `❓ *Question:* ${question}\n${response}`;
  await message.client.sendMessage(message.jid, { text: replyText });
});
