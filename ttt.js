const { Module } = require('../main');

// Map to store active TicTacToe games by chat ID (jid)
const activeTTTGames = new Map();

// --- Bot ID and Visuals ---
const BOT_ID = 'BOT_AI'; // Unique identifier for the bot
const BOT_NAME = 'RagnaBot'; // Name to display for the bot
const BOARD_SQUARES = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const PLAYER_X_ICON = '❌';
const PLAYER_O_ICON = '⭕';

// Helper to choose a random available move
function getRandomMove(board) {
    const availableMoves = board
        .map((val, index) => (val === 0 ? index : -1))
        .filter(index => index !== -1);
    
    if (availableMoves.length === 0) return -1;
    
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
}

// Helper to format JID for mentions
function mentionjid(jid) {
    return '@' + jid.split('@')[0];
}

// --- TicTacToe Game Class ---
class TicTacToeGame {
    constructor(jid, client, humanPlayerId, humanPlayerName) {
        this.jid = jid;
        this.client = client;
        this.humanId = humanPlayerId;
        
        // Human is X (Player 1), Bot is O (Player 2)
        this.players = {
            [humanPlayerId]: { id: humanPlayerId, name: humanPlayerName, icon: PLAYER_X_ICON, marker: 1, turn: true }, 
            [BOT_ID]: { id: BOT_ID, name: BOT_NAME, icon: PLAYER_O_ICON, marker: 2, turn: false }
        };
        this.board = Array(9).fill(0);
        this.isGameOver = false;
    }

    // Board drawing and win/draw checks remain the same
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
        
        messageText += `Type \`*.ttt start*\` to play a new game against ${BOT_NAME}.`;
        
        await this.client.sendMessage(this.jid, { text: messageText, mentions });
        return { status };
    }

    async botMove() {
        // ... (Bot move logic remains the same) ...
        if (this.isGameOver || this.getCurrentPlayerId() !== BOT_ID) {
            return;
        }

        const botPlayer = this.players[BOT_ID];
        const moveIndex = getRandomMove(this.board);

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
It is now ${this.players[this.humanId].icon} *${mentionjid(this.humanId)}*'s turn.
Reply with the number *1-9* to make your move.
            `.trim();

            await this.client.sendMessage(this.jid, { text: messageText, mentions: [this.humanId] });
        }
    }

    // Core game loop: handles the human player's move
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

        // 1. Make the human move
        this.board[index] = player.marker;

        // 2. Check status after human move
        const winnerMarker = this.checkWin();
        const isDraw = this.checkDraw();
        
        if (winnerMarker !== 0) {
            return await this.endGame('win', playerId);
        } else if (isDraw) {
            return await this.endGame('draw');
        } else {
            // 3. Hand off to Bot
            this.players[playerId].turn = false;
            this.players[BOT_ID].turn = true;
            
            // Wait a moment for bot's move to feel more natural
            setTimeout(() => this.botMove(), 1500); 
            
            return { status: 'bot_turn' };
        }
    }
}

// --- 1. Main TTT Command Module (.ttt start/.ttt end/.ttt board) ---
Module({
    pattern: 'ttt ?(.*)',
    fromMe: false,
    desc: 'Starts, ends, or views a Tic-Tac-Toe game.',
    type: 'game'
}, async (message, match) => {
    const jid = message.jid;
    const senderId = message.sender;
    const senderName = message.pushName || 'Player';
    const game = activeTTTGames.get(jid);
    const argument = match[1] ? match[1].toLowerCase().trim() : '';
    
    // --- END Command ---
    if (argument === 'end') {
        if (!game || senderId !== game.humanId) {
            return await message.sendReply("❌ No active game with you to end. Use `*.ttt start*` to begin a new game.");
        }
        await game.endGame('manual');
        return;
    }
    
    // --- BOARD Command ---
    if (argument === 'board') {
        if (!game || senderId !== game.humanId) {
            return await message.sendReply("❌ No active game with you to display. Use `*.ttt start*` to begin a new game.");
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

    // --- START Command ---
    if (argument === 'start' || !argument) {
        if (game) {
            return await message.sendReply("❌ A game is already active! End it with `*.ttt end*` or wait your turn.");
        }
        
        const newGame = new TicTacToeGame(jid, message.client, senderId, senderName);
        activeTTTGames.set(jid, newGame);

        const starterMention = mentionjid(senderId);

        const initialMessage = `
**🆚 Tic-Tac-Toe Challenge: Player vs. ${BOT_NAME}! 🤖**
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
    return await message.sendReply("Welcome to Tic-Tac-Toe! Use `*.ttt start*` to begin a game, or `*.ttt end*` to stop one.");
});

// --- 2. Move Handler Module (Listening for simple numbers) ---
Module({
    on: 'text',
    fromMe: false
}, async (message) => {
    const jid = message.jid;
    const senderId = message.sender;
    const game = activeTTTGames.get(jid);
    const messageContent = message.message?.trim();
    
    // 1. Check if a game is active and it's the right player's turn
    if (!game || game.isGameOver || senderId !== game.humanId || senderId !== game.getCurrentPlayerId()) {
        return;
    }

    // 2. Check if the message is a number between 1 and 9
    const position = parseInt(messageContent);
    if (isNaN(position) || position < 1 || position > 9) {
        return; // Ignore if it's not a valid move number
    }
    
    // 3. Process the move
    const result = await game.makeMove(senderId, position);

    if (result.error) {
        // Send a reply if the move was invalid (e.g., position already taken)
        await message.sendReply(`❌ Invalid Move: ${result.error}. Try again.`);
    }
    // If successful, the game class handles the board update/bot move.
});
