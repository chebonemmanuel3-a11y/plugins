const { Module } = require('../main');

Module({
  pattern: 'remindme ?(.*)',
  fromMe: true,
  desc: 'Set a reminder after a delay',
  type: 'utility'
}, async (message, match) => {
  try {
    const input = match[1]?.trim();
    if (!input) {
      return await message.sendReply('❌ Please provide time and message!\n\nExample: .remindme 10m Drink water');
    }

    const parts = input.split(' ');
    const timePart = parts[0];
    const reminderText = parts.slice(1).join(' ');

    const timeMatch = timePart.match(/^(\d+)([smhd])$/i);
    if (!timeMatch || !reminderText) {
      return await message.sendReply('❌ Invalid format!\n\nUse: .remindme 10m Drink water');
    }

    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();

    let delay = 0;
    if (unit === 's') delay = amount * 1000;
    else if (unit === 'm') delay = amount * 60 * 1000;
    else if (unit === 'h') delay = amount * 60 * 60 * 1000;
    else if (unit === 'd') delay = amount * 24 * 60 * 60 * 1000;

    if (delay <= 0) {
      return await message.sendReply('❌ Time must be greater than zero.');
    }

    await message.sendReply(`✅ Reminder set for ${amount}${unit}: ${reminderText}`);

    setTimeout(async () => {
      await message.sendMessage(message.jid, `🔔 Reminder: ${reminderText}`);
    }, delay);
  } catch (err) {
    console.error('Reminder Error:', err);
    await message.sendReply('❌ Something went wrong while setting the reminder!');
  }
});
