const { Module } = require("../main");

// --- Global State Management ---
// Use an object to manage multiple independent boolean states
let fakePresenceStates = {
    recording: true, // Default ON for recording
    typing: false    // Default OFF for typing (New feature)
};

// --- Command: .fakerecord on/off ---
Module(
    {
        pattern: "fakerecord (on|off)",
        isPrivate: false,
        desc: "Enable/Disable fake recording indicator after user messages.",
        type: "fun",
    },
    async (message, match) => {
        const status = match[1].toLowerCase(); // 'on' or 'off'
        fakePresenceStates.recording = (status === 'on');

        const replyText = fakePresenceStates.recording 
            ? "🎤 Fake recording ENABLED." 
            : "🔇 Fake recording DISABLED.";

        await message.reply(replyText);
    }
);

// --- Command: .faketype on/off (NEW) ---
Module(
    {
        pattern: "faketype (on|off)",
        isPrivate: false,
        desc: "Enable/Disable fake typing indicator after user messages.",
        type: "fun",
    },
    async (message, match) => {
        const status = match[1].toLowerCase(); // 'on' or 'off'
        fakePresenceStates.typing = (status === 'on');

        const replyText = fakePresenceStates.typing
            ? "⌨️ Fake typing ENABLED."
            : "🚫 Fake typing DISABLED.";

        await message.reply(replyText);
    }
);

// --- On Message Listener (Triggers the effects) ---
Module(
    { onMessage: true },
    async (message) => {
        // Only run for non-command text messages
        if (message.text && !message.text.startsWith(".")) {
            const jid = message.jid;
            const client = message.client;
            
            // --- Fake Recording Logic ---
            if (fakePresenceStates.recording) {
                // Presence update API uses 'recording'
                await client.sendPresenceUpdate("recording", jid);

                // Hold for 10 seconds, then clear with 'paused'
                setTimeout(async () => {
                    await client.sendPresenceUpdate("paused", jid);
                }, 10000);
            }

            // --- Fake Typing Logic (NEW) ---
            if (fakePresenceStates.typing) {
                // Presence update API uses 'composing' for typing
                await client.sendPresenceUpdate("composing", jid);

                // Hold for 10 seconds, then clear with 'paused'
                setTimeout(async () => {
                    await client.sendPresenceUpdate("paused", jid);
                }, 10000);
            }
        }
    }
);
