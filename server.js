const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const Gobang = require('./base');
let roomInfo = {};

app.use(express.static(__dirname + '/public'));

const port = 3000;
server.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});

io.on('connection', (socket) => {

    socket.on('getRooms', () => {
        const rooms = Object.keys(roomInfo);
        let roomList = [];
        rooms.forEach((room) => {
            const roomMembers = io.sockets.adapter.rooms.get(room);
            const numMembers = roomMembers ? roomMembers.size : 0;
            roomList.push({
                name: room,
                numMembers: numMembers,
            });
        });
        io.emit('updateRooms', roomList);
    });

    socket.on('heartbeat', (data) => {
        const room = socket.room;
        if (room) {
            socket.name = data.name;
            if (data.color !== 'null') return;
            if (roomInfo[room].createPlayer(socket)) {
                roomInfo[room].init();
                if (roomInfo[room].getPlayerNumber() === 2) io.to(socket.room).emit('gameover', '开始比赛！');
                socket.emit('gameover', '你是' + (socket.player.color === 'black' ? '黑棋' : '白棋') + '！');
                io.to(room).emit('getMsg', {
                    name: "",
                    msg: encrypt(socket.name + '==>' + (socket.player.color === 'black' ? '黑棋' : '白棋')),
                    color: `<span style="color:red">系统消息</span>`
                });
                socket.emit('conn', { color: socket.player.color, hs: roomInfo[room].HORIZONTAL_SIZE, vs: roomInfo[room].VERTICAL_SIZE });
            }
        }
    });

    socket.on('joinRoom', ({ room, name }) => {
        console.log(name + " 进入房间：" + room);
        socket.room = room;
        socket.name = name;
        if (!roomInfo[room]) roomInfo[room] = new Gobang();
        io.to(room).emit('getMsg', {
            name: "",
            msg: encrypt(socket.name + '悄悄的进入房间！'),
            color: `<span style="color:red">系统消息</span>`
        });
        socket.join(room);
        if (roomInfo[room].createPlayer(socket)) {
            roomInfo[room].init();
            if (roomInfo[room].getPlayerNumber() === 2) io.to(socket.room).emit('gameover', '开始比赛！');
            socket.emit('gameover', '你是' + (socket.player.color === 'black' ? '黑棋' : '白棋') + '！');
            io.to(room).emit('getMsg', {
                name: "",
                msg: encrypt(socket.name + '==>' + (socket.player.color === 'black' ? '黑棋' : '白棋')),
                color: `<span style="color:red">系统消息</span>`
            });
            socket.emit('conn', { color: socket.player.color, hs: roomInfo[room].HORIZONTAL_SIZE, vs: roomInfo[room].VERTICAL_SIZE });
        } else {
            socket.emit('conn', { color: 'null', hs: roomInfo[room].HORIZONTAL_SIZE, vs: roomInfo[room].VERTICAL_SIZE });
        }
        boardcast(room);
    });

    socket.on('putchess', ({ row, col }) => {
        const room = socket.room;
        if (room) {
            if (roomInfo[room].getPlayerNumber() === 2) {
                roomInfo[room].putChess(row, col);
                boardcast(room);
                if (roomInfo[room].gameover(row, col)) {
                    roomInfo[room].init();
                    boardcast(room);
                    io.to(room).emit('gameover', (roomInfo[room].turn === 'black' ? '白棋' : '黑棋') + '胜！');
                    io.to(room).emit('getMsg', {
                        name: "",
                        msg: encrypt((roomInfo[room].turn === 'black' ? '白棋' : '黑棋') + '胜！'),
                        color: `<span style="color:red">系统消息</span>`
                    });
                }
            }
            else {
                io.to(room).emit('gameover', '请等玩家加入！');
            }
        }
    });

    socket.on('sendMsg', ({ name, msg, color }) => {
        const room = socket.room;
        if (room) {
            io.to(room).emit('getMsg', {
                name: name,
                msg: msg,
                color: color
            });
        }
    });

    socket.on('reset', () => {
        if (!socket.player) return;
        const room = socket.room;
        if (roomInfo[room].reset(socket.player.color)) {
            boardcast(room);
            io.to(room).emit('gameover', '开始比赛！');
        } else {
            io.to(room).emit('gameover', '请求重新开局！');
        }
    });

    socket.on('disconnect', () => {
        const room = socket.room;
        if (room) {
            console.log(socket.name + " 离开房间：" + room);
            roomInfo[room].leftGame(socket);
            io.to(room).emit('getMsg', {
                name: "",
                msg: encrypt(socket.name + '悄悄的离开房间！'),
                color: `<span style="color:red">系统消息</span>`
            });
            boardcast(room);
        }
    });
});

function boardcast(room) {
    const roomMembers = io.sockets.adapter.rooms.get(room);
    io.to(room).emit('getCheckerBoard', {
        checkerboard: roomInfo[room].checkerBoard,
        turn: roomInfo[room].turn,
        num: roomMembers ? roomMembers.size : 0
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