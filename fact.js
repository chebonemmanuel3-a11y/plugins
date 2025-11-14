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

// --- Helper: strip HTML tags ---
function stripHtmlTags(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// --- Fun Fact Command ---
Module({
  pattern: 'fact',
  fromMe: false,
  desc: 'Get a random fun fact from the internet',
  type: 'fun'
}, async (message) => {
  try {
    const url = randomSource();
    const res = await axios.get(url);

    const cleanText = stripHtmlTags(res.data);
    const sentences = cleanText.match(/([A-Z][^.!?]*[.!?])/g);

    let fact = "Couldn't fetch a fact right now.";
    if (sentences && sentences.length > 0) {
      fact = sentences[Math.floor(Math.random() * sentences.length)];
    }

    const replyText = `✨ *Fun Fact!* ✨\n${fact}\n\n🌐 Source: ${url}`;
    await message.client.sendMessage(message.jid, { text: replyText });
  } catch (err) {
    await message.sendReply("❌ Sorry, I couldn't fetch a fun fact right now. Try again later!");
  }
});
