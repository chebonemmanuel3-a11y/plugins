let rotateTimer = null;
const SOURCE = 'https://loremflickr.com/720/720/';

async function setProfilePic(bot, buffer) {
  if (bot.setProfilePicture) {
    await bot.setProfilePicture(buffer);
  } else if (bot.client?.updateProfilePicture) {
    const jid = bot.user?.id || bot.client.user?.id;
    await bot.client.updateProfilePicture(jid, buffer);
  }
}

async function fetchImageBuffer() {
  const res = await fetch(SOURCE, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function rotate(bot) {
  try {
    const buf = await fetchImageBuffer();
    await setProfilePic(bot, buf);
    console.log('[autodp] profile picture updated');
  } catch (err) {
    console.error('[autodp] error:', err.message);
  }
}

module.exports = {
  name: 'autodp',
  command: ['autodp'],
  description: 'Auto profile picture updater from LoremFlickr every 2 minutes',
  author: 'Emmanuel',

  onCommand: async ({ command, args, message, bot, reply }) => {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
      if (!rotateTimer) {
        rotateTimer = setInterval(() => rotate(bot), 2 * 60 * 1000);
        await rotate(bot);
        await reply('Autodp started.');
      } else {
        await reply('Autodp is already running.');
      }
    } else if (sub === 'off') {
      if (rotateTimer) {
        clearInterval(rotateTimer);
        rotateTimer = null;
        await reply('Autodp stopped.');
      } else {
        await reply('Autodp is not running.');
      }
    } else if (sub === 'now') {
      await rotate(bot);
      await reply('Profile picture updated now.');
    } else {
      await reply('Usage: .autodp on | off | now');
    }
  },

  onStop: async () => {
    if (rotateTimer) {
      clearInterval(rotateTimer);
      rotateTimer = null;
    }
    console.log('[autodp] stopped');
  }
};
