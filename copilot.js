const { Module, getVar, setVar } = require("../main");
const axios = require("axios");

// --- Set API Key ---
Module({
  pattern: "setkey ?(.*)",
  fromMe: true,
  desc: "Set your Copilot API key",
  usage: ".setkey your_api_key_here"
}, async (message, match) => {
  const key = match[1]?.trim();
  if (!key) {
    return await message.sendReply("_Please provide your Copilot API key._\n*Usage:* `.setkey your_api_key_here`");
  }

  await setVar("COPILOT_API_KEY", key);
  return await message.sendReply("_✅ Copilot API key saved successfully._");
});

// --- Ask Copilot ---
Module({
  pattern: "copilot ?(.*)",
  fromMe: false,
  desc: "Ask Copilot anything",
  usage: ".copilot who is the president of Kenya"
}, async (message, match) => {
  const query = match[1]?.trim();
  if (!query) {
    return await message.sendReply("_Please ask a question or give a prompt._\n*Usage:* `.copilot what is the capital of Kenya`");
  }

  const apiKey = await getVar("COPILOT_API_KEY");
  if (!apiKey) {
    return await message.sendReply("_❌ Copilot API key not set. Use `.setkey your_api_key_here` first._");
  }

  const apiUrl = `https://copilot-api.microsoft.com/v1/ask`;
  const payload = {
    prompt: query,
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

    const reply = response.data?.text?.trim();
    if (!reply) {
      return await message.sendReply("_❌ No response from Copilot. Try again later._");
    }

    return await message.sendReply(reply);
  } catch (error) {
    console.error("Copilot error:", error.message);
    return await message.sendReply("_❌ Error contacting Copilot. Check your API key or try again later._");
  }
});
