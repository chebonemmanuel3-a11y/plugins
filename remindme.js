const { Module } = require("../main");

Module({
  pattern: "remindme ?(.*)",
  fromMe: true,
  desc: "Set a reminder (e.g. .remindme 2m Drink water)",
  usage: ".remindme 10m Pray\n.remindme 1h Check oven",
}, async (message, match) => {
  const input = match[1]?.trim();
  if (!input) return await message.sendReply("_Usage: .remindme 10m Pray_");

  const timeMatch = input.match(/^(\d+)([smhd])\s+(.*)$/i);
  if (!timeMatch) {
    return await message.sendReply("_❌ Invalid format. Try: .remindme 10m Drink water_");
  }

  const amount = parseInt(timeMatch[1]);
  const unit = timeMatch[2].toLowerCase();
  const reminderText = timeMatch[3];

  let delay = 0;
  if (unit === "s") delay = amount * 1000;
  else if (unit === "m") delay = amount * 60 * 1000;
  else if (unit === "h") delay = amount * 60 * 60 * 1000;
  else if (unit === "d") delay = amount * 24 * 60 * 60 * 1000;

  if (delay <= 0) return await message.sendReply("_⏰ Time must be greater than zero._");

  await message.sendReply(`_✅ Reminder set for ${amount}${unit}: ${reminderText}_`);

  setTimeout(async () => {
    await message.sendMessage(message.jid, `_🔔 Reminder: ${reminderText}_`);
  }, delay);
});
