const { Module } = require('../main');
const axios = require('axios');

// --- LibreTranslate API ---
const TRANSLATE_API = "https://libretranslate.de/translate";

// --- Translator Command ---
Module({
  pattern: 'trt ?(.*)',
  fromMe: false,
  desc: 'Translate text to a target language',
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

  // Validation
  if (!textToTranslate || !targetLang) {
    return await message.sendReply("❌ Usage:\n.trt <lang> (when replying)\n.trt <text> <lang>");
  }

  try {
    const res = await axios.post(TRANSLATE_API, {
      q: textToTranslate,
      source: "auto",
      target: targetLang,
      format: "text"
    }, {
      headers: { "Content-Type": "application/json" }
    });

    const translated = res.data?.translatedText;
    if (!translated) throw new Error("No translation returned");

    await message.client.sendMessage(message.jid, {
      text: `🌐 *Translated to ${targetLang}:*\n${translated}`
    });
  } catch (err) {
    await message.sendReply("❌ Translation failed. Make sure the language code is valid (e.g. 'fr', 'sw', 'de').");
  }
});
