const { Module } = require('../main');
const axios = require('axios');

Module({
  pattern: 'trt ?(.*)',
  fromMe: false,
  desc: 'Translate text using MyMemory API',
  type: 'utility'
}, async (message, match) => {
  let input = match[1]?.trim();
  let targetLang = '';
  let textToTranslate = '';

  // Case 1: Reply mode `.trt <lang>`
  if (message.reply_message && input) {
    targetLang = input.toLowerCase();
    textToTranslate = message.reply_message.text;
  }

  // Case 2: Direct mode `.trt <text> <lang>`
  else if (input) {
    const parts = input.split(' ');
    targetLang = parts.pop().toLowerCase();
    textToTranslate = parts.join(' ');
  }

  if (!textToTranslate || !targetLang) {
    return await message.sendReply("❌ Usage:\n.trt <lang> (when replying)\n.trt <text> <lang>");
  }

  try {
    const res = await axios.get("https://api.mymemory.translated.net/get", {
      params: {
        q: textToTranslate,
        langpair: `auto|${targetLang}`
      }
    });

    const translated = res.data?.responseData?.translatedText;
    if (!translated) throw new Error("No translation returned");

    await message.client.sendMessage(message.jid, {
      text: `🌐 *Translated to ${targetLang}:*\n${translated}`
    });
  } catch (err) {
    await message.sendReply("❌ Translation failed. Make sure the language code is valid (e.g. 'fr', 'sw', 'de').");
  }
});
