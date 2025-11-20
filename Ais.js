const { Module } = require('../main');
const axios = require('axios');

// DeepSeek Investigative AI
Module({
  pattern: 'deepseek2 ?(.*)',
  fromMe: false,
  desc: 'Investigative AI query with references and cost',
  type: 'ai'
}, async (message, match) => {
  const prompt = match[1]?.trim();
  if (!prompt) return await message.sendReply('❌ Usage: .deepseek2 <your query>');
  try {
    const res = await axios.post('https://api.deepseek.com/query', { prompt });
    await message.sendReply(`🔎 DeepSeek:\n${res.data?.output || '⚠️ No response.'}`);
  } catch (err) {
    await message.sendReply('❌ Error contacting DeepSeek.');
  }
});

// Gemini Chat
Module({
  pattern: 'gemini2 ?(.*)',
  fromMe: false,
  desc: 'Chat with Gemini AI',
  type: 'ai'
}, async (message, match) => {
  const prompt = match[1]?.trim();
  if (!prompt) return await message.sendReply('❌ Usage: .gemini2 <your question>');
  try {
    const res = await axios.post('https://api.gemini.com/chat', { prompt });
    await message.sendReply(`🤖 Gemini:\n${res.data?.output || '⚠️ No response.'}`);
  } catch (err) {
    await message.sendReply('❌ Error contacting Gemini.');
  }
});

// Imagine / Draw
Module({
  pattern: 'imagine2 ?(.*)',
  fromMe: false,
  desc: 'Generate an image from a prompt',
  type: 'ai'
}, async (message, match) => {
  const prompt = match[1]?.trim();
  if (!prompt) return await message.sendReply('❌ Usage: .imagine2 <description>');
  const imageUrl = `https://www.sourcesplash.com/i/random?q=${encodeURIComponent(prompt)}`;
  await message.sendFile(imageUrl, { caption: `🖼️ Image for "${prompt}"` });
});

// LLaMA Chat
Module({
  pattern: 'llama2 ?(.*)',
  fromMe: false,
  desc: 'Chat with LLaMA AI',
  type: 'ai'
}, async (message, match) => {
  const prompt = match[1]?.trim();
  if (!prompt) return await message.sendReply('❌ Usage: .llama2 <your question>');
  try {
    const res = await axios.post('https://api.llama.com/chat', { prompt });
    await message.sendReply(`🦙 LLaMA:\n${res.data?.output || '⚠️ No response.'}`);
  } catch (err) {
    await message.sendReply('❌ Error contacting LLaMA.');
  }
});

// Fun Commands
Module({
  pattern: 'jokes2',
  fromMe: false,
  desc: 'Get a random joke',
  type: 'fun'
}, async (message) => {
  const res = await axios.get('https://v2.jokeapi.dev/joke/Any');
  await message.sendReply(`😂 ${res.data?.setup || res.data?.joke}`);
});

Module({
  pattern: 'advice2',
  fromMe: false,
  desc: 'Get random advice',
  type: 'fun'
}, async (message) => {
  const res = await axios.get('https://api.adviceslip.com/advice');
  await message.sendReply(`💡 ${res.data?.slip?.advice}`);
});

Module({
  pattern: 'trivia2',
  fromMe: false,
  desc: 'Get a trivia question',
  type: 'fun'
}, async (message) => {
  const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
  const q = res.data.results[0];
  await message.sendReply(`❓ ${q.question}\nOptions: ${q.incorrect_answers.join(', ')} + ${q.correct_answer}`);
});

Module({
  pattern: 'inspire2',
  fromMe: false,
  desc: 'Get an inspirational quote',
  type: 'fun'
}, async (message) => {
  const res = await axios.get('https://api.quotable.io/random');
  await message.sendReply(`🌟 "${res.data.content}" — ${res.data.author}`);
});

// Pairing Codes
Module({
  pattern: 'pair2 ?(.*)',
  fromMe: false,
  desc: 'Generate pairing codes for a number',
  type: 'utility'
}, async (message, match) => {
  const number = match[1]?.trim();
  if (!number) return await message.sendReply('❌ Usage: .pair2 <number>');
  try {
    const res = await axios.post('https://api.pairing.com/code', { number });
    await message.sendReply(`🔑 Pairing Code: ${res.data?.code || '⚠️ No code generated.'}`);
  } catch (err) {
    await message.sendReply('❌ Error generating pairing code.');
  }
});

// Wallpapers
Module({
  pattern: 'best-wallp2',
  fromMe: false,
  desc: 'Fetch best wallpapers',
  type: 'utility'
}, async (message) => {
  const res = await axios.get('https://api.unsplash.com/photos/random?query=wallpaper');
  await message.sendFile(res.data?.urls?.full, { caption: '🖼️ Best Wallpaper' });
});

Module({
  pattern: 'random2',
  fromMe: false,
  desc: 'Fetch random wallpapers',
  type: 'utility'
}, async (message) => {
  const res = await axios.get('https://api.unsplash.com/photos/random');
  await message.sendFile(res.data?.urls?.full, { caption: '🎲 Random Wallpaper' });
});
