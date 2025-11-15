const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL = "gemini-2.5-flash-preview-09-2025";

function buildPrompt(input, options) {
  // Modes: translate, currency, summarize, json, default
  if (options.currency) {
    const [amount, from, to] = options.currency;
    return `Convert ${amount} ${from} to ${to}. Return JSON only:
{
  "converted": "number",
  "rate": "number",
  "from": "${from}",
  "to": "${to}"
}`;
  }

  if (options.translate) {
    return `Translate the following to ${options.translate}. Return JSON only:
{
  "original": "${input}",
  "translated": "string",
  "language": "${options.translate}"
}`;
  }

  if (options.summarize) {
    return `Summarize clearly and concisely in bullet points. Text:
"${input}"`;
  }

  if (options.json) {
    return `Answer the following and respond in JSON only (use keys "answer" and "notes"):
"${input}"`;
  }

  // Default freeform Q&A
  return input;
}

async function askGemini(prompt, systemText = "You are a helpful assistant. Return concise, accurate answers.") {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) return "_❌ GEMINI_API_KEY not configured._";

  const apiUrl = `${API_BASE_URL}${MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "text/plain",
      temperature: 0.4,
      maxOutputTokens: 1024
    },
    systemInstruction: { parts: [{ text: systemText }] }
  };

  try {
    const res = await axios.post(apiUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000
    });
    const out = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!out) return "_❌ No response from AI. Try again._";
    return out;
  } catch (err) {
    return "_❌ Request failed. Try again later._";
  }
}

function parseOptions(raw) {
  const opts = {};
  // --translate to <lang>
  const tMatch = raw.match(/--translate\s+to\s+([a-zA-Z- ]+)/i);
  if (tMatch) opts.translate = tMatch[1].trim();

  // --currency <amount> <from> <to>
  const cMatch = raw.match(/--currency\s+([\d.]+)\s+([a-zA-Z]{3})\s+([a-zA-Z]{3})/i);
  if (cMatch) opts.currency = [cMatch[1], cMatch[2], cMatch[3]];

  // --summarize
  if (/--summarize/i.test(raw)) opts.summarize = true;

  // --json
  if (/--json/i.test(raw)) opts.json = true;

  return opts;
}

Module({
  pattern: "gemini ?(.*)",
  fromMe: false,
  desc: "Ask Gemini anything: Q&A, translate, currency, summarize, JSON.",
  usage: ".gemini who is the president of Ke\n.gemini mimi ni mtoto mzuri --translate to English\n.gemini --currency 100 kes usd"
}, async (message, match) => {
  const raw = match[1]?.trim();
  if (!raw) {
    return await message.sendReply(
      "*Usage examples:*\n" +
      "• .gemini who is the president of Ke\n" +
      "• .gemini mimi ni mtoto mzuri --translate to English\n" +
      "• .gemini --currency 100 kes usd\n" +
      "• .gemini summarize: Kenya budget protests --summarize\n" +
      "• .gemini what is KES inflation? --json"
    );
  }

  const options = parseOptions(raw);
  // Remove flags from the input text for clean prompts
  const input = raw
    .replace(/--translate\s+to\s+[a-zA-Z- ]+/i, "")
    .replace(/--currency\s+[\d.]+\s+[a-zA-Z]{3}\s+[a-zA-Z]{3}/i, "")
    .replace(/--summarize/i, "")
    .replace(/--json/i, "")
    .trim();

  const prompt = buildPrompt(input, options);

  await message.sendReply("_Thinking with Gemini..._");
  const output = await askGemini(prompt, options.translate
    ? "You are a multilingual translator. Support Sheng, Swahili, slang. Return JSON only."
    : options.currency
      ? "You are a financial assistant. Estimate currency conversion using current context. Return JSON only."
      : options.summarize
        ? "You are a concise analyst. Summarize clearly and accurately."
        : options.json
          ? "You are a precise assistant. Return JSON only."
          : "You are a helpful assistant. Be factual and concise."
  );

  // Try to parse JSON if the mode suggests JSON
  if (options.translate || options.currency || options.json) {
    const clean = output.replace(/```json|```/g, "").trim();
    try {
      const obj = JSON.parse(clean);

      // Pretty printing per mode
      if (options.translate) {
        const reply =
          `🌍 *Translation to ${obj.language || options.translate}*\n` +
          `• Original: ${obj.original}\n` +
          `• Translated: ${obj.translated}`;
        return await message.sendReply(reply);
      }

      if (options.currency) {
        const reply =
          `💱 *Currency Conversion*\n` +
          `• Rate: 1 ${(obj.from || options.currency[1]).toUpperCase()} = ${obj.rate} ${(obj.to || options.currency[2]).toUpperCase()}\n` +
          `• Converted: ${Number(obj.converted).toFixed(2)} ${(obj.to || options.currency[2]).toUpperCase()}`;
        return await message.sendReply(reply);
      }

      // Generic JSON mode
      const reply =
        `🧩 *JSON Response*\n` +
        "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
      return await message.sendReply(reply);
    } catch {
      // If parsing fails, return raw
      return await message.sendReply(output);
    }
  }

  // Non-JSON modes: return text
  return await message.sendReply(output);
});
