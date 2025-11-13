// drafts.js — Multi-Mode Drafts Game Plugin (Group PVP, DM PvE)

const { Module } = require('../main');
const botConfig = require("../config"); 

// --- Global State Management ---
let pendingDrafts = {};

// --- Constants ---
const BOARD_SIZE = 8;
const EMPTY = ' ';
const P1_MAN = '⚫'; 
const P2_MAN = '⚪'; 
const P1_KING = '🔴';
const P2_KING = '🟠';
const BOT_JID = botConfig.JID; // Assuming bot JID is available in config
const BOT_NAME = "Bot";
const BRANDING = "\n\n— powered by gemini & Emmanuel";
const PROMPT_1 = "➡️ *Step 1:* Use *.move RC* (e.g., *.move 52*) to select a piece.";
const PROMPT_2 = "➡️ *Step 2:* Reply with the *number* of the destination (1, 2, 3...)";

// [NOTE: Helper functions createNewBoard, renderBoard, calculateValidMoves remain the same.]

// --- Placeholder for Bot Logic (PvE) ---
function getBotMove(board, difficulty) {
    // This is the core AI. For now, it returns a random valid move (Easy difficulty).
    // In a real implementation, 'easy' might be random, 'medium' might prioritize captures, 
    // and 'hard' might use minimax or deep search.

    // Logic to find and execute a simple random move:
    // 1. Find all available moves for P2_MAN pieces.
    // 2. Select a random move from the list.
    // 3. Return the move: { oldR, oldC, newR, newC, type: 'move' | 'jump' }
    
    // For now, this is a placeholder. Returning null will skip the bot move.
    return null; 
}


// --- Command: .drafts (Start Game) ---
Module({
    pattern: 'drafts|checkers ?(.*)',
    fromMe: false,
    desc: 'Starts a game of Drafts. Use *.drafts @user* in a group (PVP) or *.drafts [difficulty]* in DM (PvE).',
    type: 'game'
}, async (message, match) => {
    
    if (pendingDrafts[message.jid]) {
        return await message.sendReply("❌ A game is already active! Use *.stopdrafts* to end it.");
    }
    
    const newBoard = createNewBoard();
    const args = match[1]?.trim().toLowerCase();
    
    let p1 = message.sender; 
    let p2 = null;
    let mode = 'PVP'; // Default mode

    // 1. --- DM / Private Chat Logic (PvE vs. Bot) ---
    if (!message.isGroup) {
        mode = 'PvE';
        p2 = BOT_JID; // Opponent is the Bot
        
        // Check for difficulty argument
        let difficulty = 'medium'; // Default difficulty
        if (args && ['easy', 'hard'].includes(args)) {
            difficulty = args;
        }

        const game = {
            player1: p1,
            player2: p2,
            board: newBoard,
            turn: p1,
            activePiece: null, 
            validMoves: null,
            messageKey: (await message.sendReply(`Starting PvE ${difficulty.toUpperCase()} game against the Bot...`)).key,
            mode: mode,
            difficulty: difficulty,
        };
        pendingDrafts[message.jid] = game;
        
        const boardText = renderBoard(game);
        return await message.edit(boardText, message.jid, game.messageKey);
    }
    
    // 2. --- Group Chat Logic (PVP) ---
    else { 
        // Look for a mentioned user to be P2
        if (message.mentions && message.mentions.length > 0) {
            p2 = message.mentions[0];
        }
        
        if (p1 === p2 || !p2) {
            return await message.sendReply("❌ In a group, please mention the user you want to play against (e.g., *.drafts @user*).");
        }

        const game = {
            player1: p1,
            player2: p2,
            board: newBoard,
            turn: p1,
            activePiece: null, 
            validMoves: null,
            messageKey: (await message.sendReply('Starting PVP game...')).key,
            mode: mode,
        };
        pendingDrafts[message.jid] = game;
        
        const boardText = renderBoard(game);
        return await message.edit(boardText, message.jid, game.messageKey, { contextInfo: { mentionedJid: [p1, p2] } });
    }
});


// --- Move Handler (Step 2: Destination Selection) ---
Module({
    on: 'text',
    fromMe: false
}, async (message) => {
    
    const game = pendingDrafts[message.jid];
    if (!game || !game.activePiece) return; 

    // Only the current player can make the move
    if (message.sender !== game.turn) return; 

    const selectedNumber = parseInt(message.message.trim());
    
    if (isNaN(selectedNumber) || selectedNumber < 1 || !game.validMoves || selectedNumber > game.validMoves.length) {
        return; 
    }

    const selectedMove = game.validMoves[selectedNumber - 1];
    // [CODE TO EXECUTE MOVE AND SWITCH TURNS GOES HERE]
    
    // Simple execution placeholder:
    const { r: newR, c: newC } = selectedMove;
    const { r: oldR, c: oldC } = game.activePiece;
    const pieceToMove = game.board[oldR][oldC];
    game.board[newR][newC] = pieceToMove;
    game.board[oldR][oldC] = EMPTY;

    // --- Switch Turns ---
    game.turn = (game.turn === game.player1) ? game.player2 : game.player1;
    game.activePiece = null;
    game.validMoves = null;
    
    // --- BOT MOVE TRIGGER (If PvE Mode) ---
    if (game.mode === 'PvE' && game.turn === game.player2) {
        
        // Update board display with current state before bot moves
        await message.edit(renderBoard(game), message.jid, game.messageKey);

        // Wait a moment for better UX
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const botMoveResult = getBotMove(game.board, game.difficulty); 
        
        if (botMoveResult) {
            // [CODE TO EXECUTE BOT MOVE GOES HERE]
            // For now, we skip the move and switch back to the user
            game.turn = game.player1; // Switch turn back to player 1
        } else {
            // If the bot can't find a move (game over/error), switch back
            game.turn = game.player1;
            // Send an error message or end game
        }
    }


    // Update board display
    await message.edit(renderBoard(game), message.jid, game.messageKey);
});
