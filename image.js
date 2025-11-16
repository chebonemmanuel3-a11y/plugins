const { Module } = require('../main');
const axios = require('axios');

Module({
  pattern: 'image ?(.*)',
  fromMe: false,
  desc: 'Fetch a random image from SourceSplash using a prompt',
  type: 'utility'
}, async (message, match) => {
  try {
    const prompt = match[1]?.trim();
    if (!prompt) {
      return await message.sendReply('❌ Usage: .image <search term>');
    }

    await message.sendReply(`🔍 Fetching a random "${prompt}" image...`);

    // SourceSplash direct random image link
    const imageUrl = `https://www.sourcesplash.com/i/random?q=${encodeURIComponent(prompt)}`;

    // Send the image directly
    await message.sendFile(imageUrl, { caption: `🖼️ Random image for "${prompt}"` });

  } catch (err) {
    console.error('image fetch error:', err);
    await message.sendReply('❌ Error fetching image.');
  }
});
