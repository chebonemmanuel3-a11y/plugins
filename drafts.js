// drafts.js — Two-Player Drafts (Checkers) Game Plugin (Two-Step Input)

const { Module } = require('../main');

// --- Global State Management ---
// Stores active games: { chatId: { player1: JID, player2: JID, board: [], turn: JID, messageKey: JID, 
//                                  activePiece: {r, c} | null, validMoves: [] | null, mustCapture: boolean } }
let pendingDrafts = {};

// --- Constants ---
const BOARD_SIZE = 8;
const EMPTY = ' ';
const P1_MAN = '⚫'; // Player 1 (Bottom, moves up/P1_MAN)
const P2_MAN = '⚪'; // Player 2 (Top, moves down/P2_MAN)
const P1_KING = '🔴';
const P2_KING = '🟠';
const BRANDING = "\n\n— powered by gemini & Emmanuel";
const PROMPT_1 = "➡️ *Step 1:* Use *.move RC* (e.g., *.move 52*) to select a piece.";
const PROMPT_2 = "➡️ *Step 2:* Reply with the *number* of the destination (1, 2, 3...)";

// Helper to get piece info
const PIECES = {
    [P1_MAN]: { type: 'man', player: 1, direction: -1 }, // P1 moves up (r decreases)
    [P2_MAN]: { type: 'man', player: 2, direction: 1 },  // P2 moves down (r increases)
    [P1_KING]: { type: 'king', player: 1, direction: 0 },
    [P2_KING]: { type: 'king', player: 2, direction: 0 },
};

// --- Core Helper Functions (Simplified for Draft) ---

/**
 * Creates the initial 8x8 drafts board.
 */
function createNewBoard() {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    // P2 (Top - Rows 0, 1, 2)
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 !== 0) board[r][c] = P2_MAN;
        }
    }

    // P1 (Bottom - Rows 5, 6, 7)
    for (let r = 5; r < 8; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 !== 0) board[r][c] = P1_MAN;
        }
    }
    return board;
}

/**
 * Renders the board as a formatted text string.
 * Highlights valid moves if a piece is selected.
 */
function renderBoard(game) {
    const { board, player1, player2, turn, activePiece, validMoves } = game;
    let boardStr = "  *1 2 3 4 5 6 7 8*\n";
    let moveListStr = ""; // List of numbered moves for Step 2

    // Row rendering loop
    for (let r = 0; r < BOARD_SIZE; r++) {
        boardStr += `${r + 1} `;
        for (let c = 0; c < BOARD_SIZE; c++) {
            const squareColor = (r + c) % 2 === 0 ? '⬜' : '⬛'; 
            let piece = board[r][c];

            // Check if this square is a valid destination for the active piece
            const moveIndex = validMoves ? validMoves.findIndex(m => m.r === r && m.c === c) : -1;
            
            if (moveIndex !== -1) {
                // If it's a valid move, display the move number instead of the square
                const moveNumber = moveIndex + 1;
                moveListStr += `*${moveNumber}.* ${activePiece.r}${activePiece.c} to ${r}${c}\n`;
                piece = `[${moveNumber}]`; // Use a custom marker for the number
                boardStr += piece;
            } else {
                boardStr += piece !== EMPTY ? piece : squareColor;
            }
        }
        boardStr += '\n';
    }

    const p1Name = `@${player1.split('@')[0]}`;
    const p2Name = `@${player2.split('@')[0]}`;
    const turnName = turn === player1 ? p1Name : p2Name;
    const turnSymbol = turn === player1 ? P1_MAN : P2_MAN;
    const movePrompt = activePiece ? `${PROMPT_2}\n\n${moveListStr}` : PROMPT_1;

    const legend = `\n⚫ ${p1Name} | ⚪ ${p2Name}`;
    const status = `\n👑 *Turn:* ${turnSymbol} ${turnName}`;

    return `⚔️ *Drafts Game!* ⚔️\n\n${boardStr}${legend}${status}\n${movePrompt}${BRANDING}`;
}


// --- Placeholder: Calculates all valid moves for a piece (Complex logic needed here) ---
function calculateValidMoves(board, r, c, playerTurn) {
    // NOTE: This is complex and requires checking normal moves, jumps, and mandatory captures.
    // For now, we return a dummy list to test the two-step flow.
    
    // In a real game, this function would enforce all rules.
    const piece = board[r][c];
    if (!piece || PIECES[piece].player.toString() !== (playerTurn === pendingDrafts[r].player1 ? '1' : '2')) {
        return [];
    }

    let dummyMoves = [];
    if (r === 5 && c === 2) { // Example: P1 piece at 52 can move to 41 or 43
        dummyMoves.push({ r: 4, c: 1, type: 'move' });
        dummyMoves.push({ r: 4, c: 3, type: 'move' });
    }
    
    return dummyMoves; // Returns [{r, c, type: 'move'}]
}


// --- Command: .drafts (Start Game) ---
Module({
    pattern: 'drafts|checkers',
    fromMe: false,
    desc: 'Starts a two-player game of Drafts (Checkers).',
    type: 'game'
}, async (message) => {
    
    if (!message.isGroup) {
        return await message.sendReply("❌ Drafts can only be played in a group chat.");
    }
    
    if (pendingDrafts[message.jid]) {
        return await message.sendReply("❌ A game is already active! Use *.stopdrafts* to end it.");
    }

    const p1 = message.sender; 
    let p2 = null;

    if (message.mentions && message.mentions.length > 0) {
        p2 = message.mentions[0];
    }
    
    if (p1 === p2 || !p2) {
        return await message.sendReply("❌ Please mention the user you want to play against (e.g., *.drafts @user*).");
    }

    const newBoard = createNewBoard();
    
    const game = {
        player1: p1,
        player2: p2,
        board: newBoard,
        turn: p1,
        activePiece: null, // No piece selected yet
        validMoves: null, // No valid moves calculated yet
        messageKey: (await message.sendReply('Starting game...')).key
    };

    pendingDrafts[message.jid] = game;
    
    const boardText = renderBoard(game);

    await message.edit(boardText, message.jid, game.messageKey, { contextInfo: { mentionedJid: [p1, p2] } });
});


// --- Command: .move (Step 1: Piece Selection) ---
Module({
    pattern: 'move ?(.*)',
    fromMe: false,
    desc: 'Selects the piece to move in the Drafts game.',
    type: 'game'
}, async (message, match) => {
    
    const game = pendingDrafts[message.jid];
    
    if (!game) return await message.sendReply("❌ No active Drafts game in this chat. Start one with *.drafts @user*.");
    if (message.sender !== game.turn) return await message.sendReply("❌ It is not your turn!");
    
    const input = match[1]?.trim();
    if (!input || !input.match(/^\d{2}$/)) {
        return await message.sendReply("❌ Invalid input. Use *.move RC* (e.g., *.move 52*) to select a piece.");
    }
    
    // Parse coordinates (e.g., 52 -> r=4, c=1)
    const r = parseInt(input[0]) - 1;
    const c = parseInt(input[1]) - 1;

    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
        return await message.sendReply("❌ Invalid coordinates. Row/Column must be between 1 and 8.");
    }
    
    const piece = game.board[r][c];
    if (piece === EMPTY || !PIECES[piece]) {
        return await message.sendReply("❌ No piece found at that square, or the square is white.");
    }
    
    const playerPiece = (game.turn === game.player1) ? PIECES[P1_MAN].player : PIECES[P2_MAN].player;
    if (PIECES[piece].player !== playerPiece) {
        return await message.sendReply("❌ That is not your piece.");
    }

    // --- Calculate Valid Moves ---
    const validMoves = calculateValidMoves(game.board, r, c, game.turn);
    
    if (validMoves.length === 0) {
        return await message.sendReply("❌ That piece has no valid moves this turn.");
    }
    
    // Update state for Step 2
    game.activePiece = { r, c };
    game.validMoves = validMoves;
    
    await message.edit(renderBoard(game), message.jid, game.messageKey, { contextInfo: { mentionedJid: [game.player1, game.player2] } });
    
    // Crucial: Clear the active piece state after sending the message, 
    // waiting for the reply handler to pick up the final move. (Optional, but simpler)

    // return await message.sendReply("Now reply with the number (1, 2, 3...) of the destination.");
});


// --- Move Handler (Step 2: Destination Selection) ---
Module({
    on: 'text',
    fromMe: false
}, async (message) => {
    
    const game = pendingDrafts[message.jid];
    if (!game || !game.activePiece) return; // No active move waiting for a reply

    if (message.sender !== game.turn) return; // Not the current player

    const selectedNumber = parseInt(message.message.trim());
    
    // Check if the reply is a valid number for a move
    if (isNaN(selectedNumber) || selectedNumber < 1 || !game.validMoves || selectedNumber > game.validMoves.length) {
        return; // Not a valid move number, ignore the text reply.
    }

    const selectedMove = game.validMoves[selectedNumber - 1];
    const { r: newR, c: newC } = selectedMove;
    const { r: oldR, c: oldC } = game.activePiece;
    
    // --- EXECUTE MOVE (Simple swap/update for now) ---
    
    const pieceToMove = game.board[oldR][oldC];
    game.board[newR][newC] = pieceToMove;
    game.board[oldR][oldC] = EMPTY;
    
    // TODO: Add Kinging check here (if piece reaches opponent's back rank)
    
    // TODO: If the move was a JUMP, remove the captured piece and check for multiple jumps!

    // Switch turns
    game.turn = (game.turn === game.player1) ? game.player2 : game.player1;
    
    // Reset move state
    game.activePiece = null;
    game.validMoves = null;
    
    // Update board display
    await message.edit(renderBoard(game), message.jid, game.messageKey, { contextInfo: { mentionedJid: [game.player1, game.player2] } });
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
