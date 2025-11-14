const { Module } = require('../main');
const axios = require('axios');

Module({
  pattern: 'joke',
  fromMe: false,
  desc: 'Get a random joke from the internet',
  type: 'fun'
}, async (message) => {
  try {
    const res = await axios.get("https://icanhazdadjoke.com/", {
      headers: { Accept: "application/json", "User-Agent": "RagnaBot Joke Plugin" }
    });

    const joke = res.data.joke;
    const replyText = `😂 *Here's a joke for you!*\n\n${joke}`;
    await message.client.sendMessage(message.jid, { text: replyText });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch a joke right now. Try again later!");
  }
});
