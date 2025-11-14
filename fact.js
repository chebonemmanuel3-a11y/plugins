const { Module } = require('../main');
const axios = require('axios');

// --- Fun Fact Sources ---
const FACT_SOURCES = [
  "https://bestlifeonline.com/random-fun-facts/",
  "https://www.rd.com/list/interesting-facts/",
  "https://facts.net/fun-facts/"
];

// --- Helper: pick random source ---
function randomSource() {
  return FACT_SOURCES[Math.floor(Math.random() * FACT_SOURCES.length)];
}

// --- Fun Fact Command ---
Module({
  pattern: 'fact',
  fromMe: false,
  desc: 'Get a random fun fact from the internet',
  type: 'fun'
}, async (message) => {
  try {
    // Pick a random source
    const url = randomSource();
    const res = await axios.get(url);

    // Extract text (simple regex for sentences)
    const text = res.data.replace(/\s+/g, ' ');
    const matches = text.match(/([A-Z][^.!?]*[.!?])/g);

    let fact = "Couldn't fetch a fact right now.";
    if (matches && matches.length > 0) {
      fact = matches[Math.floor(Math.random() * matches.length)];
    }

    const replyText = `✨ *Fun Fact!* ✨\n${fact}\n\n(Source: ${url})`;
    await message.client.sendMessage(message.jid, { text: replyText });
  } catch (err) {
    await message.sendReply("❌ Sorry, I couldn't fetch a fun fact right now. Try again later!");
  }
});
