/**
 * Auto DP Plugin for Raganork-MD
 * Author: Emmanuel + ChatGPT
 * Description: Automatically updates your WhatsApp DP with random nature images every few minutes.
 */

const { Module } = require('../main');
const axios = require('axios');

const INTERVAL_MS = 1000 * 60 * 10; // 10 minutes
const IMAGE_API = 'https://picsum.photos/720/720'; // random nature image
let enabled = false;
let interval = null;

// FIXED PATTERN: now captures "on" or "off"
Module({
  pattern: 'autodp ?(.*)',
  fromMe: true,
  desc: 'Automatically changes profile picture with random nature images.',
}, async (m, match) => {
  try {
    const command = (match[1] || '').trim().toLowerCase();

    if (command === 'on') {
      if (enabled) return await m.send('_🌿 Auto DP already running._');
      enabled = true;

      const updateDP = async () => {
        try {
          const res = await axios.get(IMAGE_API, { responseType: 'arraybuffer' });
          const img = Buffer.from(res.data, 'binary');
          await m.client.updateProfilePicture(m.user, img);
          console.log('[autodp] ✅ DP updated from Picsum.photos');
        } catch (err) {
          console.error('[autodp] Error:', err.message);
        }
      };

      await updateDP();
      interval = setInterval(updateDP, INTERVAL_MS);
      await m.send('_✅ Auto DP started — updates every 10 minutes._');
      return;
    }

    if (command === 'off') {
      if (!enabled) return await m.send('_Auto DP is not running._');
      clearInterval(interval);
      enabled = false;
      await m.send('_🛑 Auto DP stopped._');
      return;
    }

    // If no argument provided
    await m.send('*Usage:*\n.autodp on → start auto dp\n.autodp off → stop auto dp');
  } catch (err) {
    console.error('[autodp] Fatal error:', err);
    await m.send('_❌ Error running Auto DP plugin._');
  }
});
