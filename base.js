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

    /**
     * 创建玩家
     * @param {*} socket 
     */
    createPlayer(socket) {
        let playerCount = this.players.length;
        if (playerCount >= 2) return false;
        let player = {
            socket: socket,
            color: this.colorList.pop()
        }
        this.players.push(player);
        socket.player = player;
        return true;
    }

    /**
     * 获取人数
     */
    getPlayerNumber() {
        return this.players.length;
    }

    /**
     * 初始化棋盘
     */
    init() {
        for (let i = 0; i < this.HORIZONTAL_SIZE + 1; i++) {
            this.checkerBoard[i] = [];
            for (var j = 0; j < this.VERTICAL_SIZE + 1; j++) {
                this.checkerBoard[i][j] = {
                    state: false,
                    type: true
                }
            }
        }
        this.gaming = true;
    }

    /**
     * 离开房间
     * @param {*} socket 
     */
    leftGame(socket) {
        if (!socket.player) return;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].color === socket.player.color) {
                this.colorList.push(this.players[i].color);
                this.players.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 逆转颜色
     */
    toggleTurn() {
        this.turn = (this.turn === 'black' ? 'white' : 'black');
    }

    putChess(x, y) {
        this.checkerBoard[x][y].state = true;
        this.checkerBoard[x][y].type = this.turn;
        this.toggleTurn();
    }

    gameover(x, y) {
        if (!this.checkAllDirectionChess(x, y)) return false;
        return true;
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
        for (let direction of directions) {
            const [dx, dy] = direction;
            let count = 1; // 连续相同棋子的计数器
            // 向正向检查
            let i = 1;
            while (count < 5 && this.isValidPosition(x + i * dx, y + i * dy) && this.checkerBoard[x + i * dx][y + i * dy].type === targetType) {
                count++;
                i++;
            }
            // 向反向检查
            i = -1;
            while (count < 5 && this.isValidPosition(x + i * dx, y + i * dy) && this.checkerBoard[x + i * dx][y + i * dy].type === targetType) {
                count++;
                i--;
            }
            // 如果获胜条件满足，返回 true
            if (count >= 5) {
                return true;
            }
        }
        return false; // 未获胜
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.HORIZONTAL_SIZE && y >= 0 && y < this.VERTICAL_SIZE;
    }

    reset(color) {
        if (!this.resetList.indexOf(color)) return false;
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