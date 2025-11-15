const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL = "gemini-2.5-flash-preview-09-2025";

async function translateText(text, targetLang) {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) return "_❌ GEMINI_API_KEY not configured._";

  const apiUrl = `${API_BASE_URL}${MODEL}:generateContent?key=${apiKey}`;
  const query = `Translate the following to ${targetLang}. Return JSON:
  {
    "original": "${text}",
    "translated": "string",
    "language": "${targetLang}"
  }`;

  const payload = {
    contents: [{ parts: [{ text: query }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 512
    },
    systemInstruction: {
      parts: [{ text: "You are a multilingual translator. Support all languages including Sheng, Swahili, and slang. Return JSON only." }]
    }
  };

  try {
    const res = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
    const json = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const clean = JSON.parse(json.replace(/```json|```/g, '').trim());
    return clean;
  } catch (err) {
    return "_❌ Couldn't translate. Try again later._";
  }
}

Module({
  pattern: "translate ?(.*)",
  fromMe: false,
  desc: "Translate text using Gemini AI",
  usage: ".translate Hello to Sheng",
}, async (message, match) => {
  const input = match[1]?.trim();
  const parts = input?.split(/ to /i);
  if (!parts || parts.length < 2) {
    return await message.sendReply("_Usage: .translate <text> to <language>_\nExample: `.translate Hello to Sheng`");
  }

  const [text, lang] = parts;
  await message.sendReply(`_Translating to ${lang}..._`);
  const result = await translateText(text, lang);

  if (typeof result === 'string') return await message.sendReply(result);

  const reply =
    `🌍 *Translation to ${result.language}*\n` +
    `• Original: ${result.original}\n` +
    `• Translated: ${result.translated}`;

  return await message.sendReply(reply);
});
