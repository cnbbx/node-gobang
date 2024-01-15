const HORIZONTAL_SIZE = 15;
const VERTICAL_SIZE = 15;

class Gobang {
    constructor() {
        this.HORIZONTAL_SIZE = HORIZONTAL_SIZE;
        this.VERTICAL_SIZE = VERTICAL_SIZE;
        this.players = [];
        this.checkerBoard = [];
        this.colorList = ['white', 'black'];
        this.gaming = false;
        this.turn = 'black';
        this.resetList = [];
    }

    createPlayer(socket) {
        if (this.players.length >= 2) return false;
        const color = this.colorList.pop();
        const player = {
            socket,
            color
        };
        this.players.push(player);
        socket.player = player;
        return true;
    }

    getPlayerNumber() {
        return this.players.length;
    }

    init() {
        this.checkerBoard = Array.from({ length: this.HORIZONTAL_SIZE + 1 }, () =>
            Array.from({ length: this.VERTICAL_SIZE + 1 }, () => ({
                state: false,
                type: true
            }))
        );
        this.gaming = true;
    }

    leftGame(socket) {
        if (!socket.player) return;
        const index = this.players.findIndex(player => player.color === socket.player.color);
        if (index !== -1) {
            const player = this.players.splice(index, 1)[0];
            this.colorList.push(player.color);
        }
    }

    toggleTurn() {
        this.turn = this.turn === 'black' ? 'white' : 'black';
    }

    putChess(x, y) {
        this.checkerBoard[x][y].state = true;
        this.checkerBoard[x][y].type = this.turn;
        this.toggleTurn();
    }

    gameover(x, y) {
        return this.checkAllDirectionChess(x, y);
    }

    checkAllDirectionChess(x, y) {
        const targetChess = this.checkerBoard[x][y];
        const targetType = targetChess.type;
        const directions = [
            [0, 1], // 水平方向
            [1, 0], // 垂直方向
            [1, 1], // 正斜线方向
            [1, -1] // 反斜线方向
        ];
        for (const direction of directions) {
            const [dx, dy] = direction;
            let count = 1; // 连续相同棋子的计数器

            for (const sign of [-1, 1]) {
                let i = sign;
                while (
                    count < 5 &&
                    this.isValidPosition(x + i * dx, y + i * dy) &&
                    this.checkerBoard[x + i * dx][y + i * dy].type === targetType
                ) {
                    count++;
                    i += sign;
                }
            }

            if (count >= 5) {
                return true;
            }
        }
        return false;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.HORIZONTAL_SIZE && y >= 0 && y < this.VERTICAL_SIZE;
    }

    reset(color) {
        if (this.resetList.includes(color)) return false;
        this.resetList.push(color);
        if (this.resetList.length >= 2) {
            this.resetList = [];
            this.init();
            return true;
        }
        return false;
    }
}

module.exports = Gobang;