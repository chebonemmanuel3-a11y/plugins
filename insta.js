const { Module } = require('../main');
const axios = require('axios');

Module({
  pattern: 'insta ?(.*)',
  fromMe: false,
  desc: 'Download Instagram photos or videos',
  type: 'downloader'
}, async (message, match) => {
  try {
    const url = match[1];
    if (!url) {
      return await message.sendReply('❌ Please provide an Instagram post link.');
    }

    await message.sendReply('⏳ Fetching Instagram media...');

    // Fetch the raw HTML of the Instagram post
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0' // pretend to be a browser
      }
    });

    // Extract Open Graph tags (og:image, og:video)
    const imageMatch = html.match(/property="og:image" content="([^"]+)"/);
    const videoMatch = html.match(/property="og:video" content="([^"]+)"/);

    if (videoMatch) {
      await message.sendFile(videoMatch[1], { caption: '📥 Instagram Video' });
    } else if (imageMatch) {
      await message.sendFile(imageMatch[1], { caption: '📥 Instagram Image' });
    } else {
      await message.sendReply('⚠️ Could not find media. The post may be private or unsupported.');
    }

  } catch (err) {
    console.error('insta error:', err);
    await message.sendReply('❌ Error fetching Instagram media.');
  }
});
