const { Module } = require('../main');
const axios = require('axios');

// --- Helper to shuffle options ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- Quiz Command ---
Module({
  pattern: 'quiz',
  fromMe: false,
  desc: 'Start a 5-question multiple-choice quiz from the internet',
  type: 'game'
}, async (message) => {
  try {
    const res = await axios.get("https://opentdb.com/api.php?amount=5&type=multiple");
    const questions = res.data.results;

    let quizText = `🧠 *Live Quiz Time!* Answer the following questions:\n\n`;
    const answerKey = [];

    questions.forEach((q, i) => {
      const allOptions = shuffle([q.correct_answer, ...q.incorrect_answers]);
      const correctIndex = allOptions.indexOf(q.correct_answer);
      answerKey.push(correctIndex);

      quizText += `*${i + 1}. ${q.question}*\n`;
      allOptions.forEach((opt, idx) => {
        quizText += `   ${String.fromCharCode(65 + idx)}. ${opt}\n`;
      });
      quizText += `\n`;
    });

    // Store answer key in memory (or use a global map if needed)
    message.quizAnswers = answerKey;

    quizText += `✅ Reply with \`.answers A B C D E\` to submit your answers.`;
    await message.client.sendMessage(message.jid, { text: quizText });
  } catch (err) {
    await message.sendReply("❌ Couldn't fetch quiz questions. Try again later!");
  }
});

// --- Answer Checker ---
Module({
  pattern: 'answers ?(.*)',
  fromMe: false,
  desc: 'Submit answers to the quiz',
  type: 'game'
}, async (message, match) => {
  const input = match[1]?.trim().toUpperCase().split(' ');
  if (!input || input.length !== 5) {
    return await message.sendReply("❌ Please submit 5 answers like `.answers A B C D E`");
  }

  const answerKey = message.quizAnswers;
  if (!answerKey || answerKey.length !== 5) {
    return await message.sendReply("❌ No quiz in progress. Start one with `.quiz`");
  }

  let score = 0;
  let resultText = `📊 *Quiz Results:*\n\n`;

  input.forEach((ans, i) => {
    const correctLetter = String.fromCharCode(65 + answerKey[i]);
    const isCorrect = ans === correctLetter;

    resultText += `*Q${i + 1}:* ${isCorrect ? '✅ Correct' : `❌ Incorrect (Correct: ${correctLetter})`}\n`;
    if (isCorrect) score++;
  });

  resultText += `🎯 *Your Score:* ${score}/5`;
  await message.client.sendMessage(message.jid, { text: resultText });
});
