Const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

// --- API Configuration ---
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL = "gemini-2.5-flash"; 

// --- JSON Schema Definition ---
const analysisSchema = {
    type: "OBJECT",
    properties: {
        "topicSummary": { "type": "STRING", "description": "A concise summary of the message's main topic or intent." },
        "sentiment": { "type": "STRING", "description": "The overall sentiment, strictly categorized as 'Positive', 'Negative', 'Neutral', or 'Mixed'." },
        "responseSuggestion": { "type": "STRING", "description": "A brief, appropriate suggestion for a human response." },
        "keywords": {
            "type": "ARRAY",
            "items": { "type": "STRING" },
            "description": "3 to 5 key terms from the message."
        }
    },
    // Ensure a clear, logical order in the output JSON
    "propertyOrdering": ["topicSummary", "sentiment", "responseSuggestion", "keywords"]
};


/**
 * Analyzes the text content using the Gemini API and returns structured JSON.
 * @param {string} textToAnalyze - The message text to be analyzed.
 * @returns {object|string} The parsed analysis object or an error message.
 */
async function analyzeMessage(textToAnalyze) {
    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) {
        return "_❌ GEMINI_API_KEY not configured. Please set it using `.setvar GEMINI_API_KEY your_api_key`_";
    }

    const apiUrl = `${API_BASE_URL}${MODEL}:generateContent?key=${apiKey}`;

    const userQuery = `Analyze the following WhatsApp message strictly according to the provided JSON schema.`;

    const payload = {
        contents: [{ 
            parts: [
                { text: userQuery },
                { text: `\n\n--- Message to Analyze ---\n${textToAnalyze}` }
            ] 
        }],
        generationConfig: {
            // Mandate JSON output
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            maxOutputTokens: 512, 
            temperature: 0.2, 
        },
        systemInstruction: {
            parts: [{ text: "You are a professional message sentiment and topic analyst. Your analysis must be purely in the requested JSON format." }]
        },
    };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000, 
        });

        const jsonString = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (jsonString) {
            // Attempt to parse the JSON
            const analysis = JSON.parse(jsonString);
            return analysis;
        } else {
            return "_❌ AI could not generate a valid JSON analysis. Try a different message._";
        }
    } catch (error) {
        console.error("Message analysis error:", error.message);
        if (error.response) {
            return `_❌ API Error: ${error.response.data?.error?.message || "Unknown API error"}_`;
        }
        return "_❌ Network or Parsing error. Please check your API key and retry._";
    }
}

// --- Command Module Definition (.analyze) ---

Module(
  {
    pattern: "analyze",
    fromMe: true, 
    desc: "Analyzes the sentiment and topic of a quoted message using Gemini AI.",
    usage: 'Reply to any message with `.analyze`',
  },
  async (message, match) => {
    if (!message.reply_message || !message.reply_message.text) {
        return await message.sendReply(`_Please reply to a text message with the command: \`.analyze\`_`);
    }

    const textToAnalyze = message.reply_message.text;

    await message.sendReply(`_Analyzing the quoted message using structured output..._`);

    // 1. Get the structured JSON analysis
    const analysisResult = await analyzeMessage(textToAnalyze);

    // 2. Check for string (error)
    if (typeof analysisResult === 'string') {
        return await message.sendReply(analysisResult);
    }

    // 3. Format the successful JSON analysis into a readable WhatsApp message
    const formattedResult = 
        `*💬 Message Analysis (Gemini AI) 📊*\n\n` + 
        `*📈 Sentiment:* ${analysisResult.sentiment}\n` +
        `*💡 Topic Summary:* ${analysisResult.topicSummary}\n\n` +
        `*🔑 Keywords:* ${analysisResult.keywords.join(', ')}\n\n` +
        `*✍️ Suggested Response:* _${analysisResult.responseSuggestion}_`;

    return await message.sendReply(formattedResult);
  }
);
