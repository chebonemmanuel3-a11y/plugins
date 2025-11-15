const { Module } = require("../main");
const axios = require("axios");

// In-memory GPT key
let GPT_API_KEY =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;

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

// --- Ask GPT with Search ---
Module({
  pattern: "gptsearch ?(.*)",
  fromMe: false,
  desc: "Ask GPT with real-time search",
  usage: ".gptsearch what is Toxic Lyrikali’s latest release",
}, async (message, match) => {
  const query = match[1]?.trim();
  if (!query) {
    return await message.sendReply("_Please ask a question or give a prompt._\n*Usage:* `.gptsearch what is the capital of Kenya`");
  }

  if (!GPT_API_KEY) {
    return await message.sendReply("_❌ GPT API key not set. Use `.setkey your_openai_api_key_here` first._");
  }

  await message.sendReply("_Thinking with GPT + Search..._");

  // Get today's date
  const today = new Date().toLocaleString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
  });

  // Search the web using Copilot’s search tool
  const searchResults = await axios.get(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`, {
    headers: {
      "Ocp-Apim-Subscription-Key": "YOUR_BING_SEARCH_API_KEY"
    }
  });

  const snippets = searchResults?.data?.webPages?.value?.slice(0, 3)?.map(r => `• ${r.name}: ${r.snippet}`)?.join("\n") || "No search results found.";

  const prompt = `FYI: Today is ${today}. You are in Kabarnet, Kenya.\nBased on the latest search results:\n${snippets}\n\nNow answer this: ${query}`;

  const payload = {
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful assistant that uses search results to answer questions accurately." },
      { role: "user", content: prompt }
    ],
    temperature: 0.6,
    max_tokens: 1024
  };

  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
      headers: {
        "Authorization": `Bearer ${GPT_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    });

    const reply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return await message.sendReply("_❌ No response from GPT. Try again._");

    return await message.sendReply(reply);
  } catch (err) {
    console.error("GPTSearch error:", err?.response?.data || err.message);
    return await message.sendReply("_❌ Error contacting GPT or Search. Please try again later._");
  }
});
