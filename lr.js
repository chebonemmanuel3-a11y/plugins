const { Module } = require('../main');
const axios = require('axios');

Module({
  pattern: 'lr ?(.*)',
  fromMe: false,
  desc: 'Get lyrics for a song (e.g. .lr Hello by Adele)',
  type: 'music'
}, async (message, match) => {
  const input = match[1]?.trim();
  if (!input) return await message.sendReply("❌ Usage: .lr <song> by <artist>\nExample: .lr Hello by Adele");

  const parts = input.split(/ by /i);
  if (parts.length < 2) return await message.sendReply("❌ Please include both song and artist.\nExample: .lr Shape of You by Ed Sheeran");

  const song = parts[0].trim();
  const artist = parts[1].trim();

  try {
    const res = await axios.get(`https://api.lyrics.ovh/v1/${artist}/${song}`);
    const lyrics = res.data?.lyrics;

    if (!lyrics) throw new Error('No lyrics found');

    const preview = lyrics.length > 3000 ? lyrics.slice(0, 3000) + '...\n\n(lyrics truncated)' : lyrics;

    await message.client.sendMessage(message.jid, {
      text: `🎶 *Lyrics for "${song}" by ${artist}*\n\n${preview}`
    });
  } catch (err) {
    await message.sendReply(`❌ Couldn't find lyrics for "${song}" by ${artist}. Try another song.`);
  }
});
