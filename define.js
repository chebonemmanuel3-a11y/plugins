const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL = "gemini-2.5-flash-preview-09-2025";

async function defineWord(word) {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) {
    return "_❌ GEMINI_API_KEY not configured. Please set it using `.setvar GEMINI_API_KEY your_api_key`_";
  }

  const apiUrl = `${API_BASE_URL}${MODEL}:generateContent?key=${apiKey}`;

  const userQuery = `Define the word "${word}" in strict JSON format using this schema:
  {
    "word": "string",
    "partOfSpeech": "string",
    "definition": "string",
    "example": "string",
    "synonyms": ["string"]
  }`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 512,
      temperature: 0.4
    },
    systemInstruction: {
      parts: [{ text: "You are a helpful dictionary assistant. Return clean, accurate definitions in JSON format." }]
    }
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const jsonString = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (jsonString) {
      const cleanJson = jsonString.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      return result;
    } else {
      return "_❌ AI could not generate a valid definition._";
    }
  } catch (error) {
    console.error("Definition error:", error.message);
    if (error.response) {
      return `_❌ API Error: ${error.response.data?.error?.message || "Unknown API error"}_`;
    }
    return "_❌ Network or Parsing error. Please check your API key and retry._";
  }
}

Module({
  pattern: "define ?(.*)",
  fromMe: false,
  desc: "Define a word using Gemini AI",
  usage: ".define serendipity",
}, async (message, match) => {
  const word = match[1]?.trim();
  if (!word) {
    return await message.sendReply("_Please provide a word to define._\n*Usage:* `.define serendipity`");
  }

  await message.sendReply(`_Looking up "${word}"..._`);

  const result = await defineWord(word);

  if (typeof result === 'string') {
    return await message.sendReply(result);
  }

  const reply =
    `📘 *${result.word}* (${result.partOfSpeech})\n\n` +
    `*Definition:* ${result.definition}\n` +
    `*Example:* "${result.example}"\n` +
    `*Synonyms:* ${result.synonyms.join(', ')}`;

  return await message.sendReply(reply);
});
