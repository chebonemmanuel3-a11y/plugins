const { Module } = require("../main");
const { lyrics } = require("./utils");
const config = require("../config");

const isPrivateBot = config.MODE !== "public";

Module(
  {
    pattern: "lyri ?(.*)",
    fromMe: isPrivateBot,
    desc: "Get lyrics for a song",
    usage: ".lyrics <song name>",
  },
  async (message, match) => {
    const query = match[1]?.trim();
    if (!query) {
      return await message.sendReply(
        "_Please provide a song name. Example: .lyrics shape of you_"
      );
    }

    try {
      const result = await lyrics(query);
      if (!result || !result.text) {
        return await message.sendReply("_Lyrics not found for this song._");
      }

      let response = `*───「 Lyrics 」───*\n\n`;
      response += `*Title:* \`${result.full_title || query}\`\n\n`;
      response += `*Lyrics:*\n${result.text}\n\n`;
      await message.sendReply(response);
    } catch (error) {
      console.error("Lyrics error:", error);
      await message.sendReply("_Failed to fetch lyrics. Please try again._");
    }
  }
);
