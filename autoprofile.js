const { Module } = require('../main');

let autoDpInterval;

Module({
  pattern: 'autodp ?(.*)',
  fromMe: false,
  desc: 'Auto generate images from a prompt, set as DP, then delete',
  type: 'utility'
}, async (message, match) => {
  const prompt = match[1]?.trim() || 'nature';

  // Prevent multiple loops
  if (autoDpInterval) {
    return await message.sendReply('⚠️ AutoDP is already running.');
  }

  await message.sendReply(`🌿 AutoDP started with prompt "${prompt}".`);

  // Function to run one cycle
  const runCycle = async () => {
    // 1) Send .img <prompt>
    const genMsg = await message.client.sendMessage(message.jid, { text: `.img ${prompt}` });

    // 2) Listen for generated image
    const listener = async (msg) => {
      if (msg.jid === message.jid && msg.fromMe && msg.image) {
        // Reply .pp to set DP
        await message.client.sendMessage(message.jid, { text: '.pp' }, { quoted: msg });

        // Wait 2 seconds then reply .delete
        setTimeout(async () => {
          await message.client.sendMessage(message.jid, { text: '.delete' }, { quoted: msg });
        }, 2000);

        message.client.off('message-new', listener);
      }
    };

    message.client.on('message-new', listener);
  };

  // Run immediately
  runCycle();

  // Then repeat every 10 minutes
  autoDpInterval = setInterval(runCycle, 10 * 60 * 1000);
});

Module({
  pattern: 'stopautodp',
  fromMe: false,
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
