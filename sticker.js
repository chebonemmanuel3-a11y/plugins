const { Module } = require('../main');

Module({
  pattern: 'antisticker',
  fromMe: true,
  desc: 'Enable anti-sticker protection in group (admin only)',
  type: 'group'
}, async (message) => {
  if (!message.isGroup) return await message.sendReply('❌ This command only works in groups.');
  const isAdmin = await message.isAdminUser();
  if (!isAdmin) return await message.sendReply('❌ You must be an admin to enable anti-sticker.');

  await message.sendReply('🛡️ Anti-sticker activated. Stickers will be auto-deleted.');

  message.client.on('message-new', async (msg) => {
    if (!msg.isGroup || msg.jid !== message.jid) return;
    if (msg.sticker && !msg.fromMe) {
      try {
        await message.client.sendMessage(msg.jid, { text: '🚫 Stickers are not allowed in this group.' }, { quoted: msg });
        await message.client.deleteMessage(msg.jid, msg.id);
      } catch (err) {
        console.error('Failed to delete sticker:', err);
      }
    }
  });
});
