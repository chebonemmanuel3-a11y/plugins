/**
 * Auto DP Plugin for Raganork-MD
 * Author: Emmanuel + ChatGPT
 * Description: Automatically updates your WhatsApp DP with random nature images every few minutes.
 */

const { Module } = require('../main');
const axios = require('axios');

const INTERVAL_MS = 1000 * 60 * 10; // 10 minutes
const IMAGE_API = 'https://picsum.photos/720/720'; // random image source (works on all servers)

let enabled = false;
let interval = null;

Module({
  pattern: 'autodp',
  fromMe: true, // set to false if you want everyone to use it
  desc: 'Automatically changes profile picture with random nature images.',
}, async (m, match) => {
  try {
    const command = (match[1] || '').trim().toLowerCase();

    // --- Turn ON ---
    if (command === 'on') {
      if (enabled) return await m.send('_Auto DP already running._');
      enabled = true;

      const updateDP = async () => {
        try {
          const res = await axios.get(IMAGE_API, { responseType: 'arraybuffer' });
          const img = Buffer.from(res.data, 'binary');

          if (m.client && typeof m.client.updateProfilePicture === 'function') {
            await m.client.updateProfilePicture(m.user, img);
            console.log('[autodp] ✅ DP updated from Picsum.photos');
          } else {
            console.warn('[autodp] ❌ updateProfilePicture not available');
          }
        } catch (err) {
          console.error('[autodp] Error fetching/updating DP:', err.message);
        }
      };

      // Run once immediately, then on interval
      await updateDP();
      interval = setInterval(updateDP, INTERVAL_MS);
      await m.send('_🌿 Auto DP started — updates every 10 minutes._');
      return;
    }

    // --- Turn OFF ---
    if (command === 'off') {
      if (!enabled) return await m.send('_Auto DP not active._');
      clearInterval(interval);
      enabled = false;
      await m.send('_🛑 Auto DP stopped._');
      return;
    }

    // --- Help message ---
    await m.send('*Usage:* `.autodp on` to start\n`.autodp off` to stop');
  } catch (err) {
    console.error('[autodp] Fatal error:', err);
    await m.send('_Error running Auto DP plugin._');
  }
});
