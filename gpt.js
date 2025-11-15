const { Module, getVar, setVar } = require("../main");
const axios = require("axios");

// --- Set GPT API Key ---
Module({
  pattern: "setkey ?(.*)",
  fromMe: true,
  desc: "Set your GPT API key",
  usage: ".setkey your_api_key_here"
}, async (message, match) => {
  const key = match[1]?.trim();
  if (!key) {
    return await message.sendReply("_Please provide your GPT API key._\n*Usage:* `.setkey your_api_key_here`");
  }

  await setVar("GPT_API_KEY", key);
  return await message.sendReply("_✅ GPT API key saved successfully._");
});

// --- Ask GPT Anything ---
Module({
  pattern: "gpt ?(.*)",
  fromMe: false,
  desc: "Ask GPT anything",
  usage: ".gpt who is the president of Kenya"
}, async (message, match) => {
  const query = match[1]?.trim();
  if (!query) {
    return await message.sendReply("_Please ask a question or give a prompt._\n*Usage:* `.gpt what is the capital of Kenya`");
  }

  const apiKey = await getVar("GPT_API_KEY");
  if (!apiKey) {
    return await message.sendReply("_❌ GPT API key not set. Use `.setkey your_api_key_here` first._");
  }

  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model: "gpt-4",
    messages: [{ role: "user", content: query }],
    temperature: 0.7,
    max_tokens: 1024
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    });

    const reply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return await message.sendReply("_❌ No response from GPT. Try again later._");
    }

    return await message.sendReply(reply);
  } catch (error) {
    console.error("GPT error:", error.message);
    return await message.sendReply("_❌ Error contacting GPT. Check your API key or try again later._");
  }
});
