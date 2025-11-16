const { Module } = require('../main');

let autoDpInterval;

Module({
  pattern: 'autodp ?(.*)',
  fromMe: true,
  desc: 'Auto generate images from a prompt, set as DP, then delete',
  type: 'utility'
}, async (message, match) => {
  try {
    const prompt = match[1]?.trim() || 'nature'; // default to "nature" if none given

    if (autoDpInterval) {
      return await message.sendReply('⚠️ AutoDP is already running.');
    }

    await message.sendReply(`🌿 AutoDP started with prompt: "${prompt}" — every 10 minutes a new DP will be set.`);

    autoDpInterval = setInterval(async () => {
      try {
        // 1) Send .img <prompt>
        await message.client.sendMessage(message.jid, { text: `.img ${prompt}` });

        // 2) Listen for generated image
        const listener = async (msg) => {
          if (msg.jid === message.jid && msg.fromMe && msg.image) {
            // Reply .pp to set DP
            await message.client.sendMessage(message.jid, { text: '.pp' }, { quoted: msg });

            // Wait 2 seconds then reply .delete
            setTimeout(async () => {
              await message.client.sendMessage(message.jid, { text: '.delete' }, { quoted: msg });
            }, 2000);

            // Detach listener after handling
            message.client.off('message-new', listener);
          }
        };

        message.client.on('message-new', listener);

      } catch (err) {
        console.error('AutoDP cycle error:', err);
      }
    }, 10 * 60 * 1000); // every 10 minutes

  } catch (err) {
    console.error('autodp error:', err);
    await message.sendReply('❌ Could not start AutoDP.');
  }
});

// Stop command
Module({
  pattern: 'stopautodp',
  fromMe: true,
  desc: 'Stop AutoDP loop',
  type: 'utility'
}, async (message) => {
  if (autoDpInterval) {
    clearInterval(autoDpInterval);
    autoDpInterval = null;
    await message.sendReply('🛑 AutoDP stopped.');
  } else {
    await message.sendReply('⚠️ AutoDP is not running.');
  }
});
