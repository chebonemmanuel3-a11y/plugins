// For Node <18, install node-fetch: npm i node-fetch
// const fetch = require('node-fetch');

let rotateTimer = null;
const SOURCE = 'https://loremflickr.com/800/800/';

async function setProfilePic(bot, buffer) {
  if (bot.setProfilePicture) {
    await bot.setProfilePicture(buffer);
    return;
  }
  if (bot.client?.updateProfilePicture) {
    const jid = bot.user?.id || bot.client.user?.id;
    if (!jid) throw new Error('Cannot resolve bot JID.');
    await bot.client.updateProfilePicture(jid, buffer);
    return;
  }
  throw new Error('No profile update method found.');
}

async function fetchImageBuffer() {
  const res = await fetch(SOURCE, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function rotate(bot) {
  try {
    const buf = await fetchImageBuffer();
    await setProfilePic(bot, buf);
    console.log('[autodp] profile picture updated from LoremFlickr');
  } catch (err) {
    console.error('[autodp] error:', err.message);
  }
}

module.exports = {
  manifest: require('./manifest.json'),

  init: async () => {
    console.log('[autodp] initialized (use .autodp on to start)');
  },

  onCommand: async (cmd, args, message, ctx) => {
    if (cmd !== 'autodp') return;

    const sub = (args[0] || '').toLowerCase();
    const isOwner = ctx?.isOwner ?? message?.isOwner ?? false;
    if (!isOwner) {
      await ctx.reply('Owner only.');
      return;
    }

    if (sub === 'on') {
      if (!rotateTimer) {
        rotateTimer = setInterval(() => rotate(ctx.bot), 2 * 60 * 1000);
        await rotate(ctx.bot); // immediate update
        await ctx.reply('Autodp started: updating every 2 minutes.');
      } else {
        await ctx.reply('Autodp is already running.');
      }
      return;
    }

    if (sub === 'off') {
      if (rotateTimer) {
        clearInterval(rotateTimer);
        rotateTimer = null;
        await ctx.reply('Autodp stopped.');
      } else {
        await ctx.reply('Autodp is not running.');
      }
      return;
    }

    if (sub === 'now') {
      await rotate(ctx.bot);
      await ctx.reply('Profile picture updated now.');
      return;
    }

    await ctx.reply('Usage: .autodp on | off | now');
  },

  shutdown: async () => {
    if (rotateTimer) {
      clearInterval(rotateTimer);
      rotateTimer = null;
    }
    console.log('[autodp] shutdown complete');
  }
};
