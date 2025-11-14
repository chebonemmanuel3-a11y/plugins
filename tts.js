const { Module } = require('../main');
const axios = require('axios');

Module({
  pattern: 'tts ?(.*)',
  fromMe: false,
  desc: 'Convert text to speech and return audio link',
  type: 'utility'
}, async (message, match) => {
  const input = match[1]?.trim();
  if (!input) return await message.sendReply("❌ Usage: .tts <text>");

  try {
    const res = await axios.post("https://ttsmp3.com/makemp3_new.php", new URLSearchParams({
      msg: input,
      lang: "Joanna", // Voice name (Joanna = English female)
      source: "ttsmp3"
    }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const audioUrl = res.data?.URL;
    if (!audioUrl || !audioUrl.startsWith("https://")) {
      throw new Error("No audio returned");
    }

    await message.client.sendMessage(message.jid, {
      text: `🔊 *Speech Output:*\n${audioUrl}`
    });
  } catch (err) {
    await message.sendReply("❌ TTS failed. Try shorter text or check your internet.");
  }
});
