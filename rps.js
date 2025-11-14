const { Module } = require('../main');

// --- RPS Options ---
const RPS_CHOICES = ['rock', 'paper', 'scissors'];
const RPS_ICONS = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️'
};

// --- Helper to decide winner ---
function getWinner(userChoice, botChoice) {
  if (userChoice === botChoice) return 'draw';
  if (
    (userChoice === 'rock' && botChoice === 'scissors') ||
    (userChoice === 'paper' && botChoice === 'rock') ||
    (userChoice === 'scissors' && botChoice === 'paper')
  ) {
    return 'user';
  }
  return 'bot';
}

// --- RPS Command Module ---
Module({
  pattern: 'rps ?(.*)',
  fromMe: false,
  desc: 'Play Rock-Paper-Scissors against the bot',
  type: 'game'
}, async (message, match) => {
  const userChoice = match[1]?.toLowerCase().trim();

  if (!RPS_CHOICES.includes(userChoice)) {
    return await message.sendReply(
      "❓ Choose one: `.rps rock`, `.rps paper`, or `.rps scissors`"
    );
  }

  // Bot randomly picks
  const botChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
  const result = getWinner(userChoice, botChoice);

  let replyText = `🆚 *Rock-Paper-Scissors*\n\n`;
  replyText += `👤 You: ${RPS_ICONS[userChoice]} ${userChoice}\n`;
  replyText += `🤖 Bot: ${RPS_ICONS[botChoice]} ${botChoice}\n\n`;

  if (result === 'draw') {
    replyText += "🤝 It's a *DRAW*!";
  } else if (result === 'user') {
    replyText += "🎉 You *WIN*!";
  } else {
    replyText += "💀 Bot *WINS*!";
  }

  await message.client.sendMessage(message.jid, { text: replyText });
});
