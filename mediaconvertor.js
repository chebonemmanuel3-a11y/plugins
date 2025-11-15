const { Module } = require('../main');

Module({
  pattern: 'mediaconvertor ?(.*)',
  fromMe: false,
  desc: 'Convert replied media into sticker, audio, or video',
  type: 'utility'
}, async (message, match) => {
  try {
    if (!message.reply_message) {
      return await message.sendReply('❌ Reply to an image, video, or audio first.');
    }

    const option = match[1]?.toLowerCase();
    if (!option) {
      return await message.sendReply('⚙️ Usage: .mediaconvertor <sticker|mp3|mp4>');
    }

    const m = message.reply_message;

    if (option === 'sticker' && (m.image || m.video)) {
      await message.sendFile(m, { asSticker: true });
    } else if (option === 'mp3' && m.audio) {
      await message.sendFile(m, { mimetype: 'audio/mp3' });
    } else if (option === 'mp4' && m.video) {
      await message.sendFile(m, { mimetype: 'video/mp4' });
    } else {
      await message.sendReply('⚠️ Unsupported conversion for this media type.');
    }

  } catch (err) {
    console.error('mediaconvertor error:', err);
    await message.sendReply('❌ Error converting media.');
  }
});
