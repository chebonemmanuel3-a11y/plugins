const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

// ✅ Example: Gemini setup (requires GEMINI_API_KEY in config.js)
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
const GEMINI_MODEL = "gemini-1.5-flash"; // safer default

async function askGemini(prompt, systemText = "You are a helpful assistant.") {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) return "_❌ GEMINI_API_KEY not configured._";

  const apiUrl = `${GEMINI_API_BASE}${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "text/plain", temperature: 0.4, maxOutputTokens: 1024 },
    systemInstruction: { parts: [{ text: systemText }] }
  };

  try {
    const res = await axios.post(apiUrl, payload, { headers: { "Content-Type": "application/json" }, timeout: 20000 });
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "_❌ No response from Gemini._";
  } catch {
    return "_❌ Request failed. Try again later._";
  }
}

// DeepSeek (requires DEEPSEEK_API_KEY in config.js)
async function askDeepSeek(prompt) {
  const apiKey = config.DEEPSEEK_API_KEY;
  if (!apiKey) return "_❌ DEEPSEEK_API_KEY not configured._";
  try {
    const res = await axios.post("https://api.deepseek.com/query", { prompt }, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return res.data?.output || "_❌ No response from DeepSeek._";
  } catch {
    return "_❌ DeepSeek request failed._";
  }
}

// LLaMA (requires LLAMA_API_KEY in config.js)
async function askLlama(prompt) {
  const apiKey = config.LLAMA_API_KEY;
  if (!apiKey) return "_❌ LLAMA_API_KEY not configured._";
  try {
    const res = await axios.post("https://api.llama.com/chat", { prompt }, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return res.data?.output || "_❌ No response from LLaMA._";
  } catch {
    return "_❌ LLaMA request failed._";
  }
}

// ---------------- Commands ----------------

// Gemini
Module({
  pattern: "gemini2 ?(.*)",
  fromMe: false,
  desc: "Ask Gemini AI anything",
  type: "ai"
}, async (message, match) => {
  const prompt = match[1]?.trim();
  if (!prompt) return await message.sendReply("❌ Usage: .gemini2 <your question>");
  await message.sendReply("_Thinking with Gemini..._");
  const output = await askGemini(prompt);
  await message.sendReply(output);
});

// DeepSeek
Module({
  pattern: "deepseek2 ?(.*)",
  fromMe: false,
  desc: "Investigative AI query with DeepSeek",
  type: "ai"
}, async (message, match) => {
  const prompt = match[1]?.trim();
  if (!prompt) return await message.sendReply("❌ Usage: .deepseek2 <your query>");
  await message.sendReply("_Investigating with DeepSeek..._");
  const output = await askDeepSeek(prompt);
  await message.sendReply(output);
});

// LLaMA
Module({
  pattern: "llama2 ?(.*)",
  fromMe: false,
  desc: "Chat with LLaMA AI",
  type: "ai"
}, async (message, match) => {
  const prompt = match[1]?.trim();
  if (!prompt) return await message.sendReply("❌ Usage: .llama2 <your question>");
  await message.sendReply("_Thinking with LLaMA..._");
  const output = await askLlama(prompt);
  await message.sendReply(output);
});

// Imagine (SourceSplash)
Module({
  pattern: "imagine2 ?(.*)",
  fromMe: false,
  desc: "Generate an image from a prompt",
  type: "ai"
}, async (message, match) => {
  const prompt = match[1]?.trim();
  if (!prompt) return await message.sendReply("❌ Usage: .imagine2 <description>");
  const imageUrl = `https://www.sourcesplash.com/i/random?q=${encodeURIComponent(prompt)}`;
  await message.sendFile(imageUrl, { caption: `🖼️ Image for "${prompt}"` });
});

// Fun Commands
Module({
  pattern: "jokes2",
  fromMe: false,
  desc: "Get a random joke",
  type: "fun"
}, async (message) => {
  const res = await axios.get("https://v2.jokeapi.dev/joke/Any");
  await message.sendReply(`😂 ${res.data?.setup || res.data?.joke}`);
});

Module({
  pattern: "advice2",
  fromMe: false,
  desc: "Get random advice",
  type: "fun"
}, async (message) => {
  const res = await axios.get("https://api.adviceslip.com/advice");
  await message.sendReply(`💡 ${res.data?.slip?.advice}`);
});

Module({
  pattern: "trivia2",
  fromMe: false,
  desc: "Get a trivia question",
  type: "fun"
}, async (message) => {
  const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
  const q = res.data.results[0];
  await message.sendReply(`❓ ${q.question}\nOptions: ${q.incorrect_answers.join(", ")} + ${q.correct_answer}`);
});

Module({
  pattern: "inspire2",
  fromMe: false,
  desc: "Get an inspirational quote",
  type: "fun"
}, async (message) => {
  const res = await axios.get("https://api.quotable.io/random");
  await message.sendReply(`🌟 "${res.data.content}" — ${res.data.author}`);
});

// Wallpapers
Module({
  pattern: "best-wallp2",
  fromMe: false,
  desc: "Fetch best wallpapers",
  type: "utility"
}, async (message) => {
  const res = await axios.get("https://api.unsplash.com/photos/random?query=wallpaper&client_id=" + config.UNSPLASH_API_KEY);
  await message.sendFile(res.data?.urls?.full, { caption: "🖼️ Best Wallpaper" });
});

Module({
  pattern: "random2",
  fromMe: false,
  desc: "Fetch random wallpapers",
  type: "utility"
}, async (message) => {
  const res = await axios.get("https://api.unsplash.com/photos/random?client_id=" + config.UNSPLASH_API_KEY);
  await message.sendFile(res.data?.urls?.full, { caption: "🎲 Random Wallpaper" });
});
