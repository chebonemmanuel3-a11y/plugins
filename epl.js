const { Module } = require('../main');
const axios = require('axios');

// --- EPL Table ---
Module({
  pattern: 'epl table',
  fromMe: false,
  desc: 'Show current EPL table',
  type: 'sports'
}, async (message) => {
  try {
    // OpenFootball JSON feed (no key required)
    const res = await axios.get("https://raw.githubusercontent.com/openfootball/football.json/master/2025-26/en.1.json");
    const matches = res.data.matches;

    // Build standings
    const standings = {};
    matches.forEach(m => {
      if (!m.score) return;
      const home = m.team1;
      const away = m.team2;
      const hs = m.score.ft[0];
      const as = m.score.ft[1];

      if (!standings[home]) standings[home] = { pts: 0, played: 0 };
      if (!standings[away]) standings[away] = { pts: 0, played: 0 };

      standings[home].played++;
      standings[away].played++;

      if (hs > as) standings[home].pts += 3;
      else if (hs < as) standings[away].pts += 3;
      else { standings[home].pts++; standings[away].pts++; }
    });

    const sorted = Object.entries(standings).sort((a,b) => b[1].pts - a[1].pts);
    let tableText = `🏆 *English Premier League Table*\n\n`;
    sorted.slice(0,10).forEach(([team, stats], i) => {
      tableText += `${i+1}. ${team} - ${stats.pts} pts (Played: ${stats.played})\n`;
    });

    await message.client.sendMessage(message.jid, { text: tableText });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch EPL table.");
  }
});

// --- EPL Fixtures ---
Module({
  pattern: 'epl fixture',
  fromMe: false,
  desc: 'Show upcoming EPL fixtures',
  type: 'sports'
}, async (message) => {
  try {
    // Scorebat API (no key required)
    const res = await axios.get("https://www.scorebat.com/video-api/v3/feed/?competition=ENGLAND:Premier%20League");
    const fixtures = res.data.response.slice(0,10);

    let fixtureText = `📅 *Upcoming EPL Fixtures*\n\n`;
    fixtures.forEach(f => {
      fixtureText += `${f.title}\n${f.date}\n\n`;
    });

    await message.client.sendMessage(message.jid, { text: fixtureText });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch EPL fixtures.");
  }
});
