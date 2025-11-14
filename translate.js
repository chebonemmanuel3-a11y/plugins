const { Module } = require('../main');
const axios = require('axios');

// --- RapidAPI credentials ---
const RAPID_API_KEY = 'your_rapidapi_key_here'; // Replace with your actual key
const TRANSLATE_API = 'https://google-translate1.p.rapidapi.com/language/translate/v2';

// --- Translator Command ---
Module({
  pattern: 'trt ?(.*)',
  fromMe: false,
  desc: 'Translate text using Google Translate API',
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
    const res = await axios.post(TRANSLATE_API, new URLSearchParams({
      q: textToTranslate,
      target: targetLang,
      source: 'auto'
    }), {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': 'google-translate1.p.rapidapi.com'
      }
    });

    const translated = res.data?.data?.translations[0]?.translatedText;
    if (!translated) throw new Error("No translation returned");

    await message.client.sendMessage(message.jid, {
      text: `🌐 *Translated to ${targetLang}:*\n${translated}`
    });
  } catch (err) {
    await message.sendReply("❌ Translation failed. Check your API key and language code.");
  }
});
