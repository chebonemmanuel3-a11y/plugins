const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL = "gemini-2.5-flash-preview-09-2025";

async function convertCurrency(amount, from, to) {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) return "_❌ GEMINI_API_KEY not configured._";

  const apiUrl = `${API_BASE_URL}${MODEL}:generateContent?key=${apiKey}`;
  const query = `Convert ${amount} ${from} to ${to}. Return only this JSON format:
  {
    "amount": "number",
    "from": "string",
    "to": "string",
    "converted": "number",
    "rate": "number"
  }`;

  const payload = {
    contents: [{ parts: [{ text: query }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 512
    },
    systemInstruction: {
      parts: [{ text: "You are a financial assistant. Return clean conversion data in JSON format." }]
    }
  };

  try {
    const res = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
    const json = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const clean = JSON.parse(json.replace(/```json|```/g, '').trim());
    return clean;
  } catch (err) {
    return "_❌ Couldn't convert currency. Try again later._";
  }
}

Module({
  pattern: "currency ?(.*)",
  fromMe: false,
  desc: "Convert currency using Gemini AI",
  usage: ".currency 100 kes usd",
}, async (message, match) => {
  const input = match[1]?.trim();
  const [amount, from, to] = input?.split(/\s+/) || [];

  if (!amount || !from || !to) {
    return await message.sendReply("_Usage: .currency <amount> <from> <to>_\nExample: `.currency 100 kes usd`");
  }

  await message.sendReply(`_Converting ${amount} ${from.toUpperCase()} to ${to.toUpperCase()}..._`);
  const result = await convertCurrency(amount, from, to);

  if (typeof result === 'string') return await message.sendReply(result);

  const reply =
    `💱 *Currency Conversion*\n` +
    `• Amount: ${result.amount} ${result.from.toUpperCase()}\n` +
    `• Rate: 1 ${result.from.toUpperCase()} = ${result.rate} ${result.to.toUpperCase()}\n` +
    `• Converted: ${result.converted.toFixed(2)} ${result.to.toUpperCase()}`;

  return await message.sendReply(reply);
});
