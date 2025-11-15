const { Module } = require("../main");
const { lyri } = require("./utils");
const config = require("../config");

const isPrivateBot = config.MODE !== "public";

Module(
  {
    pattern: "lyri ?(.*)",
    fromMe: isPrivateBot,
    desc: "Get lyri for a song",
    usage: ".lyri <song name>",
  },
  async (message, match) => {
    const query = match[1]?.trim();
    if (!query) {
      return await message.sendReply(
        "_Please provide a song name. Example: .lyri shape of you_"
      );
    }

    try {
      const result = await lyri(query);
      if (!result || !result.text) {
        return await message.sendReply("_Lyri not found for this song._");
      }

      let response = `*───「 lyri 」───*\n\n`;
      response += `*Title:* \`${result.full_title || query}\`\n\n`;
      response += `*lyri:*\n${result.text}\n\n`;
      await message.sendReply(response);
    } catch (error) {
      console.error("lyri error:", error);
      await message.sendReply("_Failed to fetch lyri. Please try again._");
    }
  }
);
