const { Module } = require('../main');

// Map to store active TicTacToe games by chat ID (jid)
const activeTTTGames = new Map();

// --- Bot ID and Visuals ---
const BOT_ID = 'BOT_AI'; 
const BOT_NAME = 'RagnaBot'; 
const BOARD_SQUARES = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const PLAYER_X_ICON = '❌';
const PLAYER_O_ICON = '⭕';

// --- Difficulty Constants ---
const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Helper to format JID for mentions
function mentionjid(jid) {
    return '@' + jid.split('@')[0];
}

// --- CORE AI LOGIC ---

// Helper function to check if a move at 'index' leads to a win for 'marker' (1 or 2)
function checkWinAt(board, marker, index) {
    const tempBoard = [...board];
    tempBoard[index] = marker;

    const winPatterns = [ 
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (tempBoard[a] === marker && tempBoard[b] === marker && tempBoard[c] === marker) {
            return true;
        }
    }
    return false;
}

// Finds the optimal move based on the set difficulty
function findBestMove(board, difficulty) {
    const emptyIndices = board
        .map((val, index) => (val === 0 ? index : -1))
        .filter(index => index !== -1);
    
    if (emptyIndices.length === 0) return -1;
    
    const BOT_MARKER = 2;
    const HUMAN_MARKER = 1;

    // --- 1. HARD / MEDIUM: Check for Immediate Wins (Offense) ---
    if (difficulty === 'hard') {
        for (const index of emptyIndices) {
            if (checkWinAt(board, BOT_MARKER, index)) {
                return index; // Bot wins this turn
            }
        }
    }

    // --- 2. HARD / MEDIUM: Check for Immediate Losses (Defense) ---
    if (difficulty === 'hard' || difficulty === 'medium') {
        for (const index of emptyIndices) {
            if (checkWinAt(board, HUMAN_MARKER, index)) {
                return index; // Bot blocks player's win
            }
        }
    }

    // --- 3. HARD: Strategic Move (Corners/Center) ---
    if (difficulty === 'hard') {
        const center = 4;
        if (board[center] === 0) return center; // Take center if available

        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(index => board[index] === 0);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)]; // Take a random corner
        }
    }

    // --- 4. Fallback (EASY / Random) ---
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// --- TicTacToe Game Class (Updated Constructor) ---
class TicTacToeGame {
    constructor(jid, client, humanPlayerId, humanPlayerName, difficulty) { // <-- Added difficulty
        this.jid = jid;
        this.client = client;
        this.humanId = humanPlayerId;
        this.difficulty = difficulty; // Store the difficulty
        
        this.players = {
            [humanPlayerId]: { id: humanPlayerId, name: humanPlayerName, icon: PLAYER_X_ICON, marker: 1, turn: true }, 
            [BOT_ID]: { id: BOT_ID, name: BOT_NAME, icon: PLAYER_O_ICON, marker: 2, turn: false }
        };
        this.board = Array(9).fill(0);
        this.isGameOver = false;
    }

    // ... (drawBoard, getCurrentPlayerId, checkWin, checkDraw, endGame functions remain the same) ...
    
    // Board drawing helper (for brevity, keeping it defined here)
    drawBoard() {
        let boardString = '';
        for (let i = 0; i < 9; i++) {
            const value = this.board[i];
            let icon = '';
            
            if (value === 1) icon = PLAYER_X_ICON;
            else if (value === 2) icon = PLAYER_O_ICON;
            else icon = BOARD_SQUARES[i]; 

            boardString += icon;
            if ((i + 1) % 3 === 0) {
                boardString += '\n';
            }
        }
        return boardString.trim();
    }
    
    getCurrentPlayerId() {
        for (const id in this.players) {
            if (this.players[id].turn) {
                return id;
            }
        }
    }

    checkWin() {
        const winPatterns = [ 
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            const marker = this.board[a];
            if (marker !== 0 && marker === this.board[b] && marker === this.board[c]) {
                return marker;
            }
        }
        return 0;
    }
    
    checkDraw() {
        return this.board.every(cell => cell !== 0);
    }
    
    // Handles game end and cleanup
    async endGame(status, winnerId = null) {
        this.isGameOver = true;
        activeTTTGames.delete(this.jid);
        
        let messageText = `\n\n${this.drawBoard()}\n\n`;
        let mentions = [this.humanId];

        if (status === 'win') {
            const winnerName = winnerId === this.humanId ? this.players[this.humanId].name : BOT_NAME;
            const winnerIcon = this.players[winnerId].icon;
            messageText = `🎉 *WINNER: ${winnerIcon} ${winnerName}!* 🎉${messageText}`;
        } else if (status === 'draw') {
            messageText = `🤝 *GAME OVER: It's a DRAW!* 🤝${messageText}`;
        } else if (status === 'manual') {
            messageText = `🛑 *GAME ENDED* by request. Final state:${messageText}`;
        }
        
        messageText += `Type \`*.ttt start [easy/medium/hard]*\` to play a new game.`;
        
        await this.client.sendMessage(this.jid, { text: messageText, mentions });
        return { status };
    }

    // Bot Move Logic (Now uses findBestMove)
    async botMove() {
        if (this.isGameOver || this.getCurrentPlayerId() !== BOT_ID) {
            return;
        }

        const botPlayer = this.players[BOT_ID];
        const moveIndex = findBestMove(this.board, this.difficulty); // <-- AI Move Here!

        if (moveIndex === -1) {
            return await this.endGame('draw');
        }

        this.board[moveIndex] = botPlayer.marker;
        
        const winnerMarker = this.checkWin();
        const isDraw = this.checkDraw();
        
        if (winnerMarker !== 0) {
            await this.endGame('win', BOT_ID);
        } else if (isDraw) {
            await this.endGame('draw');
        } else {
            // Next Turn (Human Player)
            this.players[BOT_ID].turn = false;
            this.players[this.humanId].turn = true;

            const messageText = `
${botPlayer.icon} ${BOT_NAME} places a marker at ${moveIndex + 1}.
Board:\n${this.drawBoard()}\n
It is now ${this.players[this.humanId].icon} *${mentionjid(this.humanId)}*'s turn (${this.difficulty.toUpperCase()} difficulty).
Reply with the number *1-9* to make your move.
            `.trim();

            await this.client.sendMessage(this.jid, { text: messageText, mentions: [this.humanId] });
        }
    }

    // makeMove (remains the same as last revision)
    async makeMove(playerId, position) {
        const index = position - 1;
        const player = this.players[playerId];

        if (this.isGameOver) {
            return { error: 'Game over! Start a new one with *.ttt start*.' };
        }
        if (playerId !== this.getCurrentPlayerId()) {
            return { error: 'It is not your turn.' };
        }
        if (index < 0 || index > 8 || this.board[index] !== 0) {
            return { error: `Position *${position}* is invalid or already taken.` };
        }

        this.board[index] = player.marker;

        const winnerMarker = this.checkWin();
        const isDraw = this.checkDraw();
        
        if (winnerMarker !== 0) {
            return await this.endGame('win', playerId);
        } else if (isDraw) {
            return await this.endGame('draw');
        } else {
            this.players[playerId].turn = false;
            this.players[BOT_ID].turn = true;
            
            setTimeout(() => this.botMove(), 1500); 
            
            return { status: 'bot_turn' };
        }
    }
}

// --- Main TTT Command Module (Updated Start Logic) ---
Module({
    pattern: 'ttt ?(.*)',
    fromMe: false,
    desc: 'Starts, ends, or views a Tic-Tac-Toe game. Use: .ttt start [easy/medium/hard]',
    type: 'game'
}, async (message, match) => {
    const jid = message.jid;
    const senderId = message.sender;
    const senderName = message.pushName || 'Player';
    const game = activeTTTGames.get(jid);
    const argument = match[1] ? match[1].toLowerCase().trim() : '';
    
    // --- End / Board Commands (Logic remains the same) ---
    if (argument === 'end') {
        if (!game || senderId !== game.humanId) {
            return await message.sendReply("❌ No active game with you to end.");
        }
        await game.endGame('manual');
        return;
    }
    
    if (argument === 'board') {
        if (!game || senderId !== game.humanId) {
            return await message.sendReply("❌ No active game with you to display.");
        }
        const currentPlayerId = game.getCurrentPlayerId();
        const currentPlayer = game.players[currentPlayerId];
        const boardMessage = `
**Current Tic-Tac-Toe Board**
${game.drawBoard()}
It is currently ${currentPlayer.icon} *${currentPlayer.name}*'s turn.
        `.trim();
        return await message.client.sendMessage(jid, { text: boardMessage, mentions: [currentPlayerId] });
    }

    // --- START Command (NEW DIFFICULTY HANDLING) ---
    if (argument.startsWith('start') || !argument) {
        if (game) {
            return await message.sendReply("❌ A game is already active! End it with `*.ttt end*` or wait your turn.");
        }
        
        let difficulty = 'easy';
        // Check for difficulty in the argument string (e.g., "start hard")
        const parts = argument.split(' ');
        if (parts.length > 1 && DIFFICULTIES.includes(parts[1])) {
            difficulty = parts[1];
        }

        const newGame = new TicTacToeGame(jid, message.client, senderId, senderName, difficulty); // <-- Pass difficulty
        activeTTTGames.set(jid, newGame);

        const starterMention = mentionjid(senderId);

        const initialMessage = `
**🆚 Tic-Tac-Toe Challenge: Player vs. ${BOT_NAME} (${difficulty.toUpperCase()})! 🤖**
*You are ${PLAYER_X_ICON}. ${BOT_NAME} is ${PLAYER_O_ICON}.*
            
**Starting Board:**
${newGame.drawBoard()}

It is ${PLAYER_X_ICON} *${starterMention}*'s turn!
**Reply with the number *1-9* to make your move.**
        `.trim();

        await message.client.sendMessage(jid, { text: initialMessage, mentions: [senderId] });
        return;
    }
    
    // Invalid argument for a non-active game
    return await message.sendReply("Welcome to Tic-Tac-Toe! Use `*.ttt start [easy/medium/hard]*` to begin a game.");
});

// --- Move Handler Module (Remains the same) ---
Module({
    on: 'text',
    fromMe: false
}, async (message) => {
    const jid = message.jid;
    const senderId = message.sender;
    const game = activeTTTGames.get(jid);
    const messageContent = message.message?.trim();
    
    // Check if a game is active, human player, and their turn
    if (!game || game.isGameOver || senderId !== game.humanId || senderId !== game.getCurrentPlayerId()) {
        return;
    }

    // Check if the message is a number between 1 and 9
    const position = parseInt(messageContent);
    if (isNaN(position) || position < 1 || position > 9) {
        return; 
    }
    
    // Process the move
    const result = await game.makeMove(senderId, position);

    if (result.error) {
        await message.sendReply(`❌ Invalid Move: ${result.error}. Try again.`);
    }
});
