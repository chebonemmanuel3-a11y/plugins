const { Module } = require('../main');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

Module({
  pattern: 'tts ?(.*)',
  fromMe: false,
  desc: 'Convert text to speech and send audio',
  type: 'utility'
}, async (message, match) => {
  const input = match[1]?.trim();
  if (!input) return await message.sendReply("❌ Usage: .tts <text>");

  try {
    const res = await axios.post("https://ttsmp3.com/makemp3_new.php", new URLSearchParams({
      msg: input,
      lang: "Joanna", // English female voice
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

    // Download the audio file
    const audioRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(audioRes.data, 'binary');

    await message.client.sendMessage(message.jid, {
      audio: buffer,
      mimetype: 'audio/mp3',
      ptt: true // sends as voice note
    });
  } catch (err) {
    await message.sendReply("❌ TTS failed. Try shorter text or check your internet.");
  }
});
