const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

// --- API Configuration ---
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL = "gemini-2.5-flash-preview-09-2025"; 

// --- News Generation Function ---
async function generateNews(topic) {
    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) {
        return "_❌ GEMINI_API_KEY not configured. Please set it using `.setvar GEMINI_API_KEY your_api_key`_";
    }

    const apiUrl = `${API_BASE_URL}${MODEL}:generateContent?key=${apiKey}`;

    const userQuery = `Fetch the latest news headlines about ${topic || "Kenya"}.
    Return them strictly in JSON format with this schema:
    {
      "headlines": [
        { "title": "string", "source": "string", "time": "string" }
      ]
    }`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 1024,
            temperature: 0.4
        },
        systemInstruction: {
            parts: [{ text: "You are a professional news assistant. Provide factual, concise headlines in JSON format." }]
        }
    };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000,
        });

        const jsonString = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonString) {
            const cleanJson = jsonString.replace(/```json|```/g, '').trim();
            const news = JSON.parse(cleanJson);
            return news;
        } else {
            return "_❌ AI could not generate valid news JSON._";
        }
    } catch (error) {
        console.error("News generation error:", error.message);
        if (error.response) {
            return `_❌ API Error: ${error.response.data?.error?.message || "Unknown API error"}_`;
        }
        return "_❌ Network or Parsing error. Please check your API key and retry._";
    }
}

// --- Command Module Definition (.news) ---
Module(
  {
    pattern: "news ?(.*)",
    fromMe: false,
    desc: "Fetch latest news headlines using Gemini AI.",
    usage: ".news Kenya",
  },
  async (message, match) => {
    const topic = match[1]?.trim() || "Kenya";

    await message.sendReply(`_Fetching latest news about "${topic}"..._`);

    const newsResult = await generateNews(topic);

    if (typeof newsResult === 'string') {
        return await message.sendReply(newsResult);
    }

    let text = `📰 *Latest News on ${topic}*\n\n`;
    newsResult.headlines.forEach((h, i) => {
      text += `${i + 1}. ${h.title}\n   Source: ${h.source}\n   Time: ${h.time}\n\n`;
    });

    return await message.sendReply(text);
  }
);
