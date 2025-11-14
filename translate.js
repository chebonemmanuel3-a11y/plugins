// --- REQUIRED MODULES AND CONFIGURATION ---
const { Module } = require("../main");
const config = require("../config"); // Still needed for the module structure, but config.GEMINI_API_KEY is NOT used.
const axios = require("axios");

// --- API Configuration (Using public Google Translate endpoint) ---
const TRANSLATE_API_URL = "https://translate.googleapis.com/translate_a/single";

// --- Language Aliases ---
// NOTE: Google Translate supports many languages, but we keep the most common and local ones here.
const languageMap = {
    'en': 'English',
    'sw': 'Kiswahili',
    'sheng': 'Sheng (Nairobi Slang)', // Note: This will be translated by English/Swahili context as a dialect
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ko': 'Korean',
    'jp': 'Japanese',
    'zh': 'Chinese (Mandarin)',
    'hi': 'Hindi',
};
const SUPPORTED_LANGS = Object.keys(languageMap).map(alias => `\`${alias}\``).join(', ');

/**
 * Performs the translation using the public Google Translate endpoint.
 * @param {string} sourceText The text to be translated.
 * @param {string} targetLanguageCode The two-letter target language code (e.g., 'sw', 'en').
 * @returns {Promise<string>} The translated text.
 */
async function callGoogleTranslation(sourceText, targetLanguageCode) {
    // Treat 'sheng' as a Kiswahili dialect for translation purposes.
    const apiLangCode = targetLanguageCode === 'sheng' ? 'sw' : targetLanguageCode;
    
    // Construct the query parameters
    const params = new URLSearchParams({
        client: 'gtx',
        sl: 'auto', // Source Language: auto-detect
        tl: apiLangCode, // Target Language: The resolved code
        dt: 't', // Request translation data
        q: sourceText, // The text to translate
    });

    const apiUrl = `${TRANSLATE_API_URL}?${params.toString()}`;

    try {
        const response = await axios.get(apiUrl, { timeout: 10000 });
        
        // The response structure is complex: [[["translation"]], ...]
        const translatedText = response.data[0][0][0];

        if (translatedText) {
            // If the target was Sheng, we might need a little prompt to make it sound more Sheng.
            if (targetLanguageCode === 'sheng') {
                 // Use a small local prompt to "shengify" the standard Swahili/English translation.
                 return `*Translation to Sheng (via Swahili/English):*\n${translatedText}`;
            }
            return translatedText;
        }
        
        throw new Error("Google Translate API did not return a valid translation.");
    } catch (error) {
        // Handle specific errors for a clearer message
        const errorMessage = error.code === 'ECONNABORTED' 
            ? "Request timed out." 
            : error.message;
        throw new Error(`External Translation API failed: ${errorMessage}`);
    }
}


// --- Command Module Definition (.trans) ---
Module(
    {
        pattern: "trans(.*)",
        fromMe: true, 
        desc: "Fast language translation using Google Translate.",
        usage: '.trans <text> <lang> | (reply) .trans <lang>',
    },
    async (message, match) => {
        let sourceText = '';
        let targetLanguageAlias = '';
        let originalTextContext = '';

        const fullInput = match[1]?.trim() || '';
        const args = fullInput.split(/\s+/).filter(a => a.length > 0);

        // --- FIX: Robustly check for repliedTo text to avoid JID error ---
        const repliedToText = (message.repliedTo && typeof message.repliedTo.text === 'string' && message.repliedTo.text.trim().length > 0) 
            ? message.repliedTo.text.trim() 
            : null;

        // Case 1: Reply translation: .trans <language> (e.g., .trans sw)
        if (repliedToText && args.length === 1) {
            sourceText = repliedToText;
            targetLanguageAlias = args[0].toLowerCase();
            originalTextContext = `_Original Text (via reply):_ "${repliedToText.substring(0, Math.min(repliedToText.length, 50))}..."`;

        } 
        // Case 2: Inline translation: .trans <text> <language> (e.g., .trans my mother sw)
        else if (args.length >= 2) {
            targetLanguageAlias = args[args.length - 1].toLowerCase();
            sourceText = args.slice(0, args.length - 1).join(' ');
            originalTextContext = `_Original Text (inline):_ "${sourceText.substring(0, Math.min(sourceText.length, 50))}..."`;

        } 
        // Invalid usage or only one word provided without reply
        else {
            return await message.sendReply(
                `❌ **Invalid Usage.** Use: \`.trans <text> <lang>\` or reply to a message with \`.trans <lang>\`.\n\n` +
                `**Supported Language Codes:** ${SUPPORTED_LANGS}\n` +
                `_Example: .trans hello world sw_`
            );
        }

        if (!sourceText) {
            return await message.sendReply("❌ **Error:** I couldn't find any text to translate.");
        }

        const targetLanguage = languageMap[targetLanguageAlias] || targetLanguageAlias;
        const targetCode = Object.keys(languageMap).includes(targetLanguageAlias) ? targetLanguageAlias : null;

        if (!targetCode) {
             return await message.sendReply(`❌ **Error:** Unknown language code or alias: \`${targetLanguageAlias}\`. Please use one of the supported codes: ${SUPPORTED_LANGS}`);
        }

        const waitingMessage = await message.sendReply(`🌍 _Translating to *${targetLanguage}*..._`);

        try {
            const translation = await callGoogleTranslation(sourceText, targetCode);

            const responseMessage =
                `${originalTextContext}\n\n` +
                `*✅ Translation to ${targetLanguage}*\n` +
                `> ${translation}`;

            return await message.edit(responseMessage, waitingMessage.key);

        } catch (error) {
            console.error("TRANSLATION MODULE ERROR:", error.message);
            return await message.edit(`❌ **Translation Failed:** ${error.message.substring(0, Math.min(error.message.length, 100))}...`, waitingMessage.key);
        }
    }
);
