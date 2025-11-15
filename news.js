const { Module } = require('../main');
const axios = require('axios');

// Hard-coded NewsAPI key
const API_KEY = 'e20948fbf807498ab154e6c1cb73e0b6';

Module({
  pattern: 'news ?(.*)',
  fromMe: false,
  desc: 'Fetch latest news from Kenya',
  type: 'news'
}, async (message, match) => {
  try {
    const res = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "ke",   // Kenya
        pageSize: 5,     // top 5 headlines
        apiKey: API_KEY
      }
    });

    const articles = res.data.articles;
    if (!articles || articles.length === 0) {
      return await message.sendReply("❌ No news found right now.");
    }

    let text = `📰 *Top News from Kenya*\n\n`;
    articles.forEach((a, i) => {
      text += `${i + 1}. ${a.title}\n${a.source.name}\n\n`;
    });

    await message.client.sendMessage(message.jid, { text });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch Kenya news. Check your API key or internet.");
  }
});
