// drafts.js — Two-Player Drafts (Checkers) Game Plugin

const { Module } = require('../main');

// --- Global State Management ---
// Stores active games: { chatId: { player1: JID, player2: JID, board: [], turn: JID, messageKey: JID } }
let pendingDrafts = {};

// --- Constants ---
const BOARD_SIZE = 8;
const EMPTY = ' ';
const P1_MAN = '⚫'; // Player 1 (Bottom)
const P2_MAN = '⚪'; // Player 2 (Top)
const P1_KING = '🔴';
const P2_KING = '🟠';
const PROMPT = "➡️ *Move:* Use coordinates (e.g., .move 32-43)";
const BRANDING = "\n\n— powered by gemini & Emmanuel";

/**
 * Creates the initial 8x8 drafts board.
 */
function createNewBoard() {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    // P2 (Top - Rows 0, 1, 2)
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            // Pieces only occupy dark squares (r+c is odd)
            if ((r + c) % 2 !== 0) {
                board[r][c] = P2_MAN;
            }
        }
    }

    // P1 (Bottom - Rows 5, 6, 7)
    for (let r = 5; r < 8; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 !== 0) {
                board[r][c] = P1_MAN;
            }
        }
    }
    return board;
}

/**
 * Renders the board as a formatted text string.
 */
function renderBoard(board, player1JID, player2JID, turnJID) {
    let boardStr = "  *1 2 3 4 5 6 7 8*\n";
    
    // Row rendering loop
    for (let r = 0; r < BOARD_SIZE; r++) {
        boardStr += `${r + 1} `;
        for (let c = 0; c < BOARD_SIZE; c++) {
            // Use a background to differentiate dark squares where pieces sit
            const squareColor = (r + c) % 2 === 0 ? '⬜' : '⬛'; 
            boardStr += board[r][c] !== EMPTY ? board[r][c] : squareColor;
        }
        boardStr += '\n';
    }

    const p1Name = `@${player1JID.split('@')[0]}`;
    const p2Name = `@${player2JID.split('@')[0]}`;
    const turnName = turnJID === player1JID ? p1Name : p2Name;
    const turnSymbol = turnJID === player1JID ? P1_MAN : P2_MAN;

    const legend = `\n⚫ ${p1Name} | ⚪ ${p2Name}`;
    const status = `\n👑 *Turn:* ${turnSymbol} ${turnName}`;

    return `⚔️ *Drafts Game Started!* ⚔️\n\n${boardStr}${legend}${status}${PROMPT}${BRANDING}`;
}


// --- Command: .drafts ---
Module({
    pattern: 'drafts|checkers',
    fromMe: false,
    desc: 'Starts a two-player game of Drafts (Checkers).',
    type: 'game'
}, async (message) => {
    
    if (!message.isGroup) {
        return await message.sendReply("❌ Drafts can only be played in a group chat.");
    }
    
    // Check if a game is already active in this chat
    if (pendingDrafts[message.jid]) {
        return await message.sendReply("❌ A game is already active! Use *.stopdrafts* to end it.");
    }

    // Player 1 is the initiator
    const p1 = message.sender; 
    let p2 = null;

    // Look for a mentioned user to be P2
    if (message.mentions && message.mentions.length > 0) {
        p2 = message.mentions[0];
    }
    
    if (p1 === p2) {
        p2 = null;
    }
    
    if (!p2) {
        return await message.sendReply("❌ Please mention the user you want to play against (e.g., *.drafts @user*).");
    }

    const newBoard = createNewBoard();
    
    // Initialize the game state
    const game = {
        player1: p1, // P1 (Bottom side, Black pieces)
        player2: p2, // P2 (Top side, White pieces)
        board: newBoard,
        turn: p1,    // P1 goes first
        messageKey: (await message.sendReply('Starting game...')).key // Track message for editing
    };

    pendingDrafts[message.jid] = game;
    
    // Render and send the first board state
    const boardText = renderBoard(newBoard, p1, p2, p1);

    await message.edit(boardText, message.jid, game.messageKey, { contextInfo: { mentionedJid: [p1, p2] } });
});


// --- Command: .move ---
// This is where the core game logic will go
Module({
    pattern: 'move ?(.*)',
    fromMe: false,
    desc: 'Makes a move in the current Drafts game.',
    type: 'game'
}, async (message, match) => {
    
    const game = pendingDrafts[message.jid];
    
    if (!game) {
        return await message.sendReply("❌ No active Drafts game in this chat. Start one with *.drafts @user*.");
    }

    if (message.sender !== game.turn) {
        return await message.sendReply("❌ It is not your turn!");
    }

    const moveInput = match[1]?.trim();
    if (!moveInput || !moveInput.match(/^\d{2}-\d{2}$/)) {
        return await message.sendReply("❌ Invalid move format. Use ROW_COL-ROW_COL (e.g., .move 32-43).");
    }
    
    // --- Rule Validation and Board Update Logic will go here ---
    
    await message.sendReply("✅ Move received! (Placeholder: Rule logic coming soon)");

    // NOTE: For now, we stop here. The next step is to implement the rule engine!
});


// --- Command: .stopdrafts ---
Module({
    pattern: 'stopdrafts',
    fromMe: false,
    desc: 'Forcibly stops the current Drafts game.',
    type: 'game'
}, async (message) => {
    if (pendingDrafts[message.jid]) {
        delete pendingDrafts[message.jid];
        return await message.sendReply('✅ Drafts game successfully stopped.');
    } else {
        return await message.sendReply('❌ No active Drafts game to stop.');
    }
});
