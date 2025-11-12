const { Module } = require("../main");
const axios = require("axios");

let autoDpEnabled = false;
let intervalId = null;

// New image source
const IMAGE_URL = "https://loremflickr.com/720/720/";

async function fetchImage() {
  try {
    const res = await axios.get(IMAGE_URL, { responseType: "arraybuffer" });
    return Buffer.from(res.data, "binary");
  } catch (e) {
    console.error("Image fetch failed:", e);
    throw e;
  }
}

async function setDp(client) {
  try {
    const imgBuffer = await fetchImage();
    await client.updateProfilePicture(client.user.id, imgBuffer);
    console.log("DP updated with random portrait image");
  } catch (e) {
    console.error("DP update failed:", e);
  }
}

Module(
  { pattern: "autodp", isPrivate: false, desc: "Set DP once with random portrait", type: "utility" },
  async (message) => {
    if (!autoDpEnabled) {
      await setDp(message.client);
      await message.reply("✅ DP updated with random portrait image.");
    } else {
      await message.reply("⚡ Auto DP is already running.");
    }
  }
);

Module(
  { pattern: "autodp on", isPrivate: false, desc: "Enable auto DP every 2 min", type: "utility" },
  async (message) => {
    if (autoDpEnabled) return await message.reply("⚡ Auto DP is already running.");
    autoDpEnabled = true;
    intervalId = setInterval(() => setDp(message.client), 2 * 60 * 1000);
    await setDp(message.client);
    await message.reply("✅ Auto DP ENABLED. Updating every 2 minutes.");
  }
);

Module(
  { pattern: "autodp off", isPrivate: false, desc: "Disable auto DP", type: "utility" },
  async (message) => {
    autoDpEnabled = false;
    clearInterval(intervalId);
    await message.reply("🔇 Auto DP DISABLED.");
  }
);
