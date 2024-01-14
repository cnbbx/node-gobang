const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const Gobang = require('./base');
let roomInfo = {};
let clientInfo = {};

app.use(express.static(__dirname + '/public'));

const port = 3000;
server.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});

io.on('connection', (socket) => {
    // 加入房间
    socket.on('joinRoom', (room) => {
        clientInfo[socket.id] = room;
        if (!roomInfo[room]) roomInfo[room] = new Gobang();
        socket.join(room);
        if (roomInfo[room].createPlayer(socket)) {
            roomInfo[room].init();
            // 玩家已连接
            if (roomInfo[room].getPlayerNumber() === 2) {
                io.to(clientInfo[socket.id]).emit('gameover', '开始比赛！');
            }
            socket.emit('conn', { color: socket.player.color, hs: roomInfo[room].HORIZONTAL_SIZE, vs: roomInfo[room].VERTICAL_SIZE });
        } else {
            // 游客已连接
            socket.emit('conn', { color: 'null', hs: roomInfo[room].HORIZONTAL_SIZE, vs: roomInfo[room].VERTICAL_SIZE });
        }
        boardcast(room);
    });

    // 监听玩家落子事件
    socket.on('putchess', ({ row, col }) => {
        if (clientInfo[socket.id]) {
            roomInfo[clientInfo[socket.id]].putChess(row, col);
            boardcast(clientInfo[socket.id]);
            if (roomInfo[clientInfo[socket.id]].gameover(row, col)) {
                roomInfo[clientInfo[socket.id]].init();
                boardcast(clientInfo[socket.id]);
                io.to(clientInfo[socket.id]).emit('gameover', (roomInfo[clientInfo[socket.id]].turn === 'black' ? '白棋' : '黑棋') + '胜！');
            }
        }
    });

    // 监听玩家发送的消息
    socket.on('sendMsg', ({ name, msg, color }) => {
        io.to(clientInfo[socket.id]).emit('getMsg', {
            name: name,
            msg: msg,
            color: color
        });
    });

    // 监听玩家重新开局
    socket.on('reset', () => {
        if (!socket.player) return;
        if (roomInfo[clientInfo[socket.id]].reset(socket.player.color)) {
            boardcast(clientInfo[socket.id]);
            io.to(clientInfo[socket.id]).emit('gameover', '开始比赛！');
        }
        else {
            io.to(clientInfo[socket.id]).emit('gameover', '请求重新开局！');
        }
    });

    // 监听玩家断开连接事件
    socket.on('disconnect', () => {
        if (clientInfo[socket.id]) roomInfo[clientInfo[socket.id]].leftGame(socket);
        if (clientInfo[socket.id]) delete clientInfo[socket.id];
    });
});

function boardcast(room) {
    io.to(room).emit('getCheckerBoard', {
        checkerboard: roomInfo[room].checkerBoard,
        turn: roomInfo[room].turn,
        num: Object.values(clientInfo).filter(value => value === room).length
    });
}

function encrypt(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const base64EncodedText = btoa(String.fromCharCode(...data));
    return base64EncodedText;
}

function decrypt(encryptedText) {
    const decodedData = atob(encryptedText);
    const uint8Array = new Uint8Array(decodedData.length);
    for (let i = 0; i < decodedData.length; ++i) {
        uint8Array[i] = decodedData.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(uint8Array);
    return decryptedText;
}