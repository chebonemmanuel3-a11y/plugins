const { Module } = require('../main');
const axios = require('axios');

const API_KEY = '5099b32e22612cb1caf1c0089a82a782'; // your key

// --- EPL Table ---
Module({
  pattern: 'epl table',
  fromMe: false,
  desc: 'Show live EPL table',
  type: 'sports'
}, async (message) => {
  try {
    const res = await axios.get("https://v3.football.api-sports.io/standings", {
      headers: { 'x-apisports-key': API_KEY },
      params: { league: 39, season: 2025 } // 39 = Premier League
    });

    const standings = res.data.response[0].league.standings[0];
    let text = `🏆 *Live EPL Table*\n\n`;
    standings.slice(0, 10).forEach((team, i) => {
      text += `${i + 1}. ${team.team.name} - ${team.points} pts (GD: ${team.goalsDiff})\n`;
    });

    await message.client.sendMessage(message.jid, { text });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch EPL table. Check your API key or internet.");
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
    const res = await axios.get("https://v3.football.api-sports.io/fixtures", {
      headers: { 'x-apisports-key': API_KEY },
      params: { league: 39, season: 2025, next: 10 } // next 10 fixtures
    });

    const fixtures = res.data.response;
    let text = `📅 *Upcoming EPL Fixtures*\n\n`;
    fixtures.forEach(f => {
      const home = f.teams.home.name;
      const away = f.teams.away.name;
      const date = new Date(f.fixture.date).toLocaleString();
      text += `${home} vs ${away} — ${date}\n`;
    });

    await message.client.sendMessage(message.jid, { text });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch EPL fixtures. Check your API key or internet.");
  }
});
