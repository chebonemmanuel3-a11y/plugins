const { Module } = require('../main');
const axios = require('axios');

Module({
  pattern: 'currency ?(.*)',
  fromMe: false,
  desc: 'Convert currencies live (e.g. .currency 100 kes usd)',
  type: 'utility'
}, async (message, match) => {
  const input = match[1]?.trim();
  if (!input) return await message.sendReply("❌ Usage: .currency <amount> <from> <to>\nExample: .currency 100 kes usd");

  const parts = input.split(/\s+/);
  if (parts.length < 3) return await message.sendReply("❌ Please provide: amount, from, to\nExample: .currency 250 eur kes");

  const amount = parseFloat(parts[0]);
  const from = parts[1].toUpperCase();
  const to = parts[2].toUpperCase();

  if (isNaN(amount) || amount <= 0) return await message.sendReply("❌ Amount must be a positive number.");
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) return await message.sendReply("❌ Use 3-letter currency codes, e.g. USD, EUR, KES, GBP.");

  try {
    const res = await axios.get('https://api.exchangerate.host/convert', {
      params: { from, to, amount }
    });

    const result = res.data?.result;
    const rate = res.data?.info?.rate;
    const date = res.data?.date;

    if (!result || !rate) throw new Error('No conversion data');

    const text =
      `💱 *Currency Conversion*\n` +
      `• Amount: ${amount} ${from}\n` +
      `• Rate: 1 ${from} = ${rate} ${to}\n` +
      `• Result: ${result.toFixed(2)} ${to}\n` +
      `• Date: ${date}`;

    await message.client.sendMessage(message.jid, { text });
  } catch (err) {
    await message.sendReply("❌ Conversion failed. Check codes (e.g. USD, EUR, KES) and try again.");
  }
});
