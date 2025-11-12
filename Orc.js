// ocr.js — Optical Character Recognition plugin for Raganork-MD

const { Module } = require('../main');
const axios = require('axios');
const FormData = require('form-data'); 

// 🔑 OCR.Space API Key (Provided by user) 🔑
const OCR_API_KEY = "K87933634788957"; 

Module({
    pattern: 'ocr',
    fromMe: false,
    desc: 'Extracts text from an attached image using OCR (Optical Character Recognition).',
    type: 'utility'
}, async (message) => {
    
    // 1. Check for required media
    if (!message.isMedia || message.mtype !== 'imageMessage') {
        return await message.sendReply('❌ Please send an **image** and use the command *.ocr* in the caption or reply to an image with *.ocr*.');
    }
    
    await message.sendReply('🔍 Analyzing image for text (OCR)... This may take a moment.');
    
    try {
        // 2. Download the image data buffer
        const imageBuffer = await message.client.downloadMediaMessage(message);
        
        // 3. Prepare the API request using FormData
        const form = new FormData();
        form.append('apikey', OCR_API_KEY);
        form.append('language', 'eng'); // Set language to English
        form.append('isOverlayRequired', 'false'); 
        form.append('file', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg',
        });

        // 4. Send the request to OCR.Space
        const response = await axios.post('https://api.ocr.space/parse/image', form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const data = response.data;
        
        // 5. Check for API errors
        if (data.IsErroredOnProcessing) {
            console.error("OCR Error:", data.ErrorMessage);
            return await message.sendReply(`❌ OCR failed to process the image: ${data.ErrorMessage[0] || "Unknown Error"}.`);
        }

        // 6. Extract and format the result
        const parsedResults = data.ParsedResults;
        let fullText = "";

        if (parsedResults && parsedResults.length > 0) {
            fullText = parsedResults.map(result => result.ParsedText.trim()).join('\n\n');
        }

        if (fullText.length > 0) {
            let reply = `*📝 Extracted Text (OCR):*\n---\n${fullText}`;
            await message.sendReply(reply);
        } else {
            await message.sendReply("⚠️ No readable text was found in the image.");
        }

    } catch (error) {
        console.error('OCR Plugin Error:', error);
        
        if (error.code === 'ENOTFOUND') {
            await message.sendReply('❌ Cannot connect to the OCR service. Check your internet connection.');
        } else {
            await message.sendReply('❌ An unexpected error occurred during OCR processing. Please ensure you ran `npm install form-data`.');
        }
    }
});
