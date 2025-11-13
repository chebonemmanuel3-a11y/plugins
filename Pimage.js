const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

// --- API Configuration for Pexels/Free Service ---
const PEXELS_API_URL = "https://api.pexels.com/v1/search";

// 🔑 HARDCODED PEXELS KEY (Provided by user) 🔑
const PEXELS_API_KEY = "8ThxsNY77ksUID32bMuFYSiZOMK3GEE7mukzeMgTA5cgvNO20ERZCHOx";

/**
 * Searches for a free image using an external API and downloads it robustly.
 * @param {string} query - The user's search query.
 * @returns {Buffer|string} The image buffer, or an error message string.
 */
async function searchImage(query) {
    // Note: We bypass checking config.PEXELS_API_KEY since it's hardcoded here.
    const apiKey = PEXELS_API_KEY; 

    try {
        // 1. Search for images based on the query
        const searchResponse = await axios.get(PEXELS_API_URL, {
            params: {
                query: query,
                per_page: 1, 
                orientation: 'landscape'
            },
            headers: {
                'Authorization': apiKey, // Using the hardcoded key
                // Use a standard, non-bot User-Agent for reliability
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000,
        });

        const photoUrl = searchResponse.data?.photos?.[0]?.src?.original;

        if (!photoUrl) {
            return `_❌ Image search failed. Could not find a free image for: "${query}". (Check query wording)_`;
        }
        
        // 2. Download the image buffer robustly
        console.log(`[pimage] Downloading image from: ${photoUrl.substring(0, 50)}...`);

        const imageDownloadResponse = await axios.get(photoUrl, {
            responseType: 'arraybuffer',
            timeout: 20000, 
        });

        return Buffer.from(imageDownloadResponse.data);

    } catch (error) {
        console.error("External Image Search Error:", error.message);
        if (error.response?.status === 401) {
             return "_❌ PEXELS KEY ERROR: The API key is invalid or has expired._";
        }
        return `_❌ External Image Search failed. Network/API Error: ${error.response?.statusText || "Connection Timed Out"}_`;
    }
}

// --- Command Module Definition (.pimage) ---

Module(
  {
    pattern: "pimage ?(.*)",
    fromMe: true, 
    desc: "Finds and returns a publicly available image based on a search query.",
    usage: '.pimage sunset over mountains',
  },
  async (message, match) => {
    const query = match[1]?.trim();

    if (!query || query.length < 3) {
      return await message.sendReply(
        `_Please provide a detailed search query (at least 3 characters) for the image you want to find!_\n\n` +
        `*Usage:* \`.pimage sunset over mountains\``
      );
    }

    await message.sendReply(`_🖼️ Searching for a public domain image matching: "${query}"..._`);

    const imageBuffer = await searchImage(query);

    // If the result is a string, it's an error message
    if (typeof imageBuffer === 'string') {
        return await message.sendReply(imageBuffer);
    }
    
    // Send the image buffer back to the chat
    await message.sendReply(imageBuffer, { 
        caption: `*✨ Image Search Result:*\n_${query}_\n\n_Found using an external free service._` 
    }, 'image');
  }
);
