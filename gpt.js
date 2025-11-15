const { Module } = require("../main");
const axios = require("axios");

// In-memory storage for the GPT API key (simple and effective for testing)
let GPT_API_KEY = null;

// --- Set GPT API Key ---
Module({
  pattern: "setkey ?(.*)",
  fromMe: true,
  desc: "Set your GPT API key",
  usage: ".setkey your_openai_api_key_here",
}, async (message, match) => {
  const key = match[1]?.trim();
  if (!key) {
    return await message.sendReply("_Please provide your GPT API key._\n*Usage:* `.setkey your_openai_api_key_here`");
  }

  GPT_API_KEY = key;
  return await message.sendReply("_✅ GPT API key saved successfully._");
});

// --- Core GPT call (kept simple, like your .recipe pipeline) ---
async function askGPT(query) {
  if (!GPT_API_KEY) {
    return "_❌ GPT API key not set. Use `.setkey your_openai_api_key_here` first._";
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const payload = {
    // Use a fast, reliable model. You can change to "gpt-4" if your key supports it.
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful, concise assistant. Be accurate and clear." },
      { role: "user", content: query }
    ],
    temperature: 0.6,
    max_tokens: 800
  };

  try {
    const res = await axios.post(apiUrl, payload, {
      headers: {
        "Authorization": `Bearer ${GPT_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    });

    const text = res?.data?.choices?.[0]?.message?.content?.trim();
    if (!text) return "_❌ No response from GPT. Try again._";
    return text;
  } catch (err) {
    console.error("GPT error:", err?.response?.data || err.message);
    if (err.response?.status === 401) {
      return "_❌ Unauthorized. Your API key may be invalid or expired._";
    }
    return "_❌ Error contacting GPT. Please try again later._";
  }
}

// --- Ask GPT Anything ---
Module({
  pattern: "gpt ?(.*)",
  fromMe: false,
  desc: "Ask GPT anything (facts, translation, summaries, etc.)",
  usage: ".gpt what is the capital of Kenya",
}, async (message, match) => {
  const query = match[1]?.trim();
  if (!query) {
    return await message.sendReply("_Please ask a question or give a prompt._\n*Usage:* `.gpt what is the capital of Kenya`");
  }

  await message.sendReply("_Thinking with GPT..._");

  const output = await askGPT(query);

  // If the core call returned a string error, send it directly
  return await message.sendReply(output);
});
