const axios = require('axios');

Module({
  pattern: 'fact',
  fromMe: false,
  desc: 'Get a random fun fact',
  type: 'fun'
}, async (message) => {
  try {
    const res = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en");
    const fact = res.data.text;

    const replyText = `✨ *Fun Fact!* ✨\n${fact}`;
    await message.client.sendMessage(message.jid, { text: replyText });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch a fun fact. Try again later!");
  }
});
