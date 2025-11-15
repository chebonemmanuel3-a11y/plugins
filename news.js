const { Module } = require('../main');
const axios = require('axios');
const cheerio = require('cheerio'); // install cheerio for HTML parsing

Module({
  pattern: 'tuko',
  fromMe: false,
  desc: 'Fetch latest headlines from Tuko Kenya',
  type: 'news'
}, async (message) => {
  try {
    const res = await axios.get("https://www.tuko.co.ke/latest/");
    const $ = cheerio.load(res.data);

    let headlines = [];
    $('article h3 a').each((i, el) => {
      if (i < 5) { // limit to top 5
        headlines.push($(el).text().trim());
      }
    });

    if (headlines.length === 0) {
      return await message.sendReply("❌ No headlines found from Tuko right now.");
    }

    let text = `📰 *Latest Tuko News*\n\n`;
    headlines.forEach((h, i) => {
      text += `${i + 1}. ${h}\n\n`;
    });

    await message.client.sendMessage(message.jid, { text });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch Tuko news. Check your internet or site availability.");
  }
});
