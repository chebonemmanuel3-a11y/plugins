const { Module } = require('../main');
// This game is always 'public' (group chat) so no need for config/isPrivateBot flags

// Map to store active TicTacToe games by chat ID (jid)
const activeTTTGames = new Map();

// Visual representation for the board
const BOARD_SQUARES = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const PLAYER_X_ICON = '❌';
const PLAYER_O_ICON = '⭕';
const EMPTY_ICON = '⬜';

// --- TicTacToe Game Class ---
class TicTacToeGame {
    constructor(jid, client, player1Id, player2Id) {
        this.jid = jid;
        this.client = client;
        this.players = {
            [player1Id]: { id: player1Id, icon: PLAYER_X_ICON, turn: true }, // Player 1 starts
            [player2Id]: { id: player2Id, icon: PLAYER_O_ICON, turn: false }
        };
        this.board = Array(9).fill(0); // 0 = empty, 1 = P1 (X), 2 = P2 (O)
        this.isGameOver = false;
    }

    // Helper to draw the board for the chat
    drawBoard() {
        let boardString = '';
        for (let i = 0; i < 9; i++) {
            const value = this.board[i];
            let icon = '';
            
            if (value === 1) icon = PLAYER_X_ICON;
            else if (value === 2) icon = PLAYER_O_ICON;
            else icon = BOARD_SQUARES[i]; // Show the number for empty spots

            boardString += icon;
            if ((i + 1) % 3 === 0) {
                boardString += '\n'; // New line after every third square
            }
        }
        return boardString.trim();
    }

    // Helper to get the ID of the current player
    getCurrentPlayerId() {
        for (const id in this.players) {
            if (this.players[id].turn) {
                return id;
            }
        }
    }
    
    // Helper to get the ID of the other player
    getOtherPlayerId(currentPlayerId) {
        for (const id in this.players) {
            if (id !== currentPlayerId) {
                return id;
            }
        }
    }
    
    // Helper to check for a winner
    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]            // Diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            const marker = this.board[a];
            if (marker !== 0 && marker === this.board[b] && marker === this.board[c]) {
                return marker; // Returns 1 (P1) or 2 (P2)
            }
        }
        return 0;
    }
    
    // Check for a draw
    checkDraw() {
        return this.board.every(cell => cell !== 0);
    }
    
    // Core game loop: handles a player's move
    async makeMove(playerId, position) {
        const index = position - 1;
        const player = this.players[playerId];
        const playerMarker = (playerId === this.players[Object.keys(this.players)[0]].id) ? 1 : 2;
        
        // Validation checks
        if (this.isGameOver) {
            return { error: 'Game over! Start a new one.' };
        }
        if (playerId !== this.getCurrentPlayerId()) {
            return { error: 'It is not your turn.' };
        }
        if (index < 0 || index > 8 || this.board[index] !== 0) {
            return { error: `Position *${position}* is invalid or already taken.` };
        }

        // 1. Make the move
        this.board[index] = playerMarker;

        // 2. Check game status
        const winnerMarker = this.checkWin();
        const isDraw = this.checkDraw();
        
        let messageText = '';
        let status = 'continue';

        if (winnerMarker !== 0) {
            // WINNER
            this.isGameOver = true;
            status = 'win';
            messageText = `🎉 Game Over! ${player.icon} ${this.mentionjid(playerId)} WINS! 🎉\n\n${this.drawBoard()}`;
            activeTTTGames.delete(this.jid);
        } else if (isDraw) {
            // DRAW
            this.isGameOver = true;
            status = 'draw';
            messageText = `🤝 Game Over! It's a DRAW! 🤝\n\n${this.drawBoard()}`;
            activeTTTGames.delete(this.jid);
        } else {
            // NEXT TURN
            this.players[playerId].turn = false;
            const otherPlayerId = this.getOtherPlayerId(playerId);
            this.players[otherPlayerId].turn = true;
            
            messageText = `
${player.icon} Move accepted.
Board:\n${this.drawBoard()}\n
It is now ${this.players[otherPlayerId].icon} *${this.mentionjid(otherPlayerId)}*'s turn.
Type: \`*.ttt [1-9]*\` to place your marker.
            `.trim();
        }
        
        // Send the game update message
        const mentions = [playerId, this.getOtherPlayerId(playerId)].filter(id => id);
        await this.client.sendMessage(this.jid, { text: messageText, mentions });
        
        return { status, board: this.drawBoard() };
    }
    
    // Helper to format JID for mentions
    mentionjid(jid) {
        return '@' + jid.split('@')[0];
    }
}

// --- Module Definition for .ttt commands ---
Module({
    pattern: 'ttt ?(.*)',
    fromMe: false,
    desc: 'Starts or plays a game of Tic-Tac-Toe. Use: .ttt @[player] to challenge, or .ttt [1-9] to move.',
    type: 'game'
}, async (message, match) => {
    const jid = message.jid;
    const senderId = message.sender;
    const game = activeTTTGames.get(jid);
    const argument = match[1] ? match[1].toLowerCase().trim() : '';

    // --- 1. Handle Active Game Moves ---
    if (game) {
        // If argument is a number 1-9, it's a move
        const position = parseInt(argument);
        if (position >= 1 && position <= 9) {
            const result = await game.makeMove(senderId, position);
            if (result.error) {
                return await message.sendReply(`❌ ${result.error}`);
            }
            return; // Move handled by game class
        }
        
        // If argument is 'board', display the current board
        if (argument === 'board') {
            const currentPlayerId = game.getCurrentPlayerId();
            const currentPlayerIcon = game.players[currentPlayerId].icon;
            const boardMessage = `
**Current Tic-Tac-Toe Board**
${game.drawBoard()}
It is currently ${currentPlayerIcon} *${game.mentionjid(currentPlayerId)}*'s turn.
            `.trim();
            return await message.client.sendMessage(jid, { text: boardMessage, mentions: [currentPlayerId] });
        }
        
        // Handle invalid command during an active game
        return await message.sendReply("❌ Invalid command. To move, type `*.ttt [1-9]*`. To see the board, type `*.ttt board*`.");
    }
    
    // --- 2. Handle Starting a New Game ---
    
    // Check if the argument is a mention (to challenge a player)
    const mentionedIds = message.mentionedJidList || [];
    const targetPlayerId = mentionedIds[0];
    
    if (targetPlayerId && targetPlayerId !== senderId) {
        // Start a new game
        
        // Basic check to ensure target is valid
        if (targetPlayerId.includes('@s.whatsapp.net')) { 
            const newGame = new TicTacToeGame(jid, message.client, senderId, targetPlayerId);
            activeTTTGames.set(jid, newGame);

            const starterMention = newGame.mentionjid(senderId);
            const targetMention = newGame.mentionjid(targetPlayerId);

            const initialMessage = `
**🔥 Tic-Tac-Toe Challenge! 🔥**
*X* ${starterMention} challenges *O* ${targetMention}!
            
**Starting Board:**
${newGame.drawBoard()}

It is ${PLAYER_X_ICON} *${starterMention}*'s turn!
Type: \`*.ttt [1-9]*\` to place your marker.
            `.trim();

            await message.client.sendMessage(jid, { text: initialMessage, mentions: [senderId, targetPlayerId] });
            return;
        }
    }
    
    // If no active game and no valid challenge, show help
    return await message.sendReply("Welcome to Tic-Tac-Toe! To start a game, challenge another player: `*.ttt @[mention_player]*`");
});
