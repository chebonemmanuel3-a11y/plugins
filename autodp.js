/**
 * @name AutoDP
 * @description Automatically updates the bot's profile picture daily from a URL.
 * @command autodp
 * @type utility
 */

const schedule = require('node-schedule');
const axios = require('axios');

// --- Configuration ---
// Set the time for the update (e.g., '0 0 * * *' = midnight every day)
// You can adjust this schedule rule: [minute] [hour] [day_of_month] [month] [day_of_week]
const SCHEDULE_RULE = '0 0 * * *'; 

// URL for the image to be fetched daily (can be any static or dynamic image URL)
const IMAGE_URL = 'https://picsum.photos/500/500'; 
// ---------------------

// Variable to hold the scheduled job object globally so we can cancel it later
let dpJob = null; 

/**
 * Function to set the profile picture
 * @param {object} client - The bot client instance
 */
async function setProfilePicture(client) {
    try {
        // 1. Check if AutoDP is ON in the persistent database
        // NOTE: The name 'db' here assumes Raganork uses a persistent storage object called 'db'.
        const status = await client.db.get('autodp_status') || 'off'; 
        if (status !== 'on') {
            return console.log(`[AutoDP] Job triggered but status is OFF. Skipping DP update.`);
        }

        console.log(`[AutoDP] Fetching image from: ${IMAGE_URL}`);
        
        // 2. Download the image data
        const response = await axios.get(IMAGE_URL, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // 3. Update the profile picture
        // NOTE: This function is a placeholder—confirm the exact method in Raganork's API.
        await client.updateProfilePicture(client.user.id, imageBuffer); 

        console.log(`[AutoDP] Successfully set new profile picture at ${new Date().toLocaleTimeString()}.`);

    } catch (error) {
        console.error('[AutoDP] Error during profile picture update:', error.message);
    }
}

/**
 * Schedules the daily job and saves the job object.
 * @param {object} client - The bot client instance
 */
function startSchedule(client) {
    if (dpJob) {
        dpJob.cancel(); // Stop any existing job first
    }
    dpJob = schedule.scheduleJob(SCHEDULE_RULE, () => {
        setProfilePicture(client);
    });
    console.log(`[AutoDP] Scheduler started. Runs daily at: ${SCHEDULE_RULE}`);
}


module.exports = {
    name: 'autodp',
    description: 'Manages the daily automatic profile picture feature.',
    command: 'autodp',
    type: 'utility',
    
    // Executes when the plugin is loaded (used to restart the schedule if status is 'on')
    onLoad: async (client) => {
        // We ensure `node-schedule` is installed first by the `package.json`
        const status = await client.db.get('autodp_status') || 'off'; // Default to 'off'
        if (status === 'on') {
            startSchedule(client);
        }
    },

    // Handles the .autodp on/off commands
    execute: async (client, message, args) => {
        if (!message.isOwner) { // Owner check
             return client.sendMessage(message.chatId, { text: '❌ This command is for the bot owner only.' }, { quoted: message });
        }
        
        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            // 1. Start the scheduled job
            startSchedule(client);
            // 2. Save the state as 'on'
            await client.db.set('autodp_status', 'on'); 
            await client.sendMessage(message.chatId, { text: `✅ *AutoDP Activated!* Profile picture will update daily at midnight UTC.` }, { quoted: message });
            
        } else if (action === 'off') {
            // 1. Cancel the scheduled job
            if (dpJob) {
                dpJob.cancel();
                dpJob = null;
            }
            // 2. Save the state as 'off'
            await client.db.set('autodp_status', 'off'); 
            await client.sendMessage(message.chatId, { text: `🚫 *AutoDP Deactivated.* The scheduled update has been stopped.` }, { quoted: message });

        } else {
            const currentStatus = await client.db.get('autodp_status') || 'off';
            await client.sendMessage(message.chatId, { text: `*AutoDP Status:* ${currentStatus.toUpperCase()}\n\nUsage:\n \`.autodp on\`\n \`.autodp off\`` }, { quoted: message });
        }
    }
};
