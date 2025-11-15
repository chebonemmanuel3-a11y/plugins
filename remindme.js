const { Module } = require("../main");
const chrono = require("chrono-node"); // Make sure this is installed

const reminders = [];

Module({
  pattern: "remindme ?(.*)",
  fromMe: true,
  desc: "Set a reminder (e.g. .remindme in 2h Drink water)",
}, async (message, match) => {
  const input = match[1]?.trim();
  if (!input) return await message.sendReply("_Usage: .remindme in 2h Take a break_");

  const [timePart, ...msgParts] = input.split(" ");
  const reminderText = msgParts.join(" ").trim();
  const parsedDate = chrono.parseDate(input);

  if (!parsedDate || !reminderText) {
    return await message.sendReply("_❌ Could not understand the time or message. Try: .remindme in 2h Drink water_");
  }

  const delay = parsedDate.getTime() - Date.now();
  if (delay <= 0) return await message.sendReply("_⏰ That time is already past. Try a future time._");

  reminders.push({ time: parsedDate, text: reminderText, chat: message.jid });

  setTimeout(async () => {
    await message.sendMessage(message.jid, `_🔔 Reminder: ${reminderText}_`);
  }, delay);

  return await message.sendReply(`_✅ Reminder set for ${parsedDate.toLocaleString()}_`);
});
