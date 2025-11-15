const { Module } = require('../main');

Module({
  pattern: 'hack ?(.*)',
  fromMe: false,
  desc: 'Fake hacking progress animation',
  type: 'fun'
}, async (message, match) => {
  try {
    const target = match[1] || 'target';
    await message.sendReply(`💻 Initiating hack on *${target}*...`);

    // Fake progress updates
    const steps = [
      '🔍 Scanning system...',
      '📡 Connecting to server...',
      '🔑 Bypassing security...',
      '📂 Accessing files...',
      '⚡ Uploading payload...',
      '📊 Progress: 0%',
      '📊 Progress: 25%',
      '📊 Progress: 50%',
      '📊 Progress: 75%',
      '📊 Progress: 100%',
      '✅ Hack complete! Data extracted from *' + target + '*'
    ];

    let delay = 1500; // 1.5 seconds between updates
    steps.forEach((step, i) => {
      setTimeout(async () => {
        await message.sendReply(step);
      }, delay * (i + 1));
    });
  } catch (err) {
    console.error('Hack plugin error:', err);
    await message.sendReply('❌ Something went wrong with the hack simulation!');
  }
});
