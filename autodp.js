/**
 * Auto DP Plugin for Raganork-MD
 * Automatically updates your WhatsApp DP with random nature images.
 */

const { Module } = require('../main');
const axios = require('axios');

const INTERVAL_MS = 1000 * 60 * 10; // every 10 minutes
const IMAGE_API = 'https://picsum.photos/720/720';
let enabled = false;
let interval = null;

Module({
  pattern: 'autodp ?(.*)',
  fromMe: true,
  desc: 'Automatically changes your WhatsApp DP with random nature images.',
}, async (m, match) => {
  try {
    const command = (match[1] || '').trim().toLowerCase();

    if (command === 'on') {
      if (enabled) {
        await m.send('_🌿 Auto DP already running._');
        return;
      }
      enabled = true;

      // ✅ Detect JID safely
      const jid =
        (m.client?.user?.id ||
         m.client?.user?.jid ||
         m.user?.id ||
         m.user?.jid ||
         m.sender) ?? null;

      if (!jid) {
        await m.send('_⚠️ Could not detect your user JID — Auto DP cannot start._');
        console.error('[autodp] No valid JID found in message context.');
        enabled = false;
        return;
      }

      const updateDP = async () => {
        try {
          const res = await axios.get(IMAGE_API, { responseType: 'arraybuffer' });
          const img = Buffer.from(res.data, 'binary');
          await m.client.updateProfilePicture(jid, img);
          console.log(`[autodp] ✅ DP updated successfully for ${jid}`);
        } catch (err) {
          console.error('[autodp] Error updating DP:', err.message);
        }
      };

      await updateDP();
      interval = setInterval(updateDP, INTERVAL_MS);
      await m.send('_✅ Auto DP started — updates every 10 minutes._');
      return;
    }

    if (command === 'off') {
      if (!enabled) {
        await m.send('_Auto DP is not running._');
        return;
      }
      clearInterval(interval);
      enabled = false;
      await m.send('_🛑 Auto DP stopped._');
      return;
    }

    await m.send('*Usage:*\n.autodp on → start auto dp\n.autodp off → stop auto dp');
  } catch (err) {
    console.error('[autodp] Fatal error:', err);
    await m.send('_❌ Error running Auto DP plugin._');
  }
});
