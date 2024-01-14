const socket = io();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const size = canvas.width;
let SIZE = 15;
const gridSize = size / SIZE;
let color = '';
let $mycolor = document.querySelector('#my-color');
let $reset = document.querySelector('#my-reset');
let $info = document.querySelector('#my-info');
let $num = document.querySelector('#my-num');
let $chatList = document.querySelector("#chat-list");
let checkerBoard = [];
let turn = '';

// 绘制棋子
function drawPiece(row, col, color) {
  const pieceX = col * gridSize;
  const pieceY = row * gridSize;
  const radius = gridSize / 2 - 2;
  // 绘制棋子阴影
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(
    pieceX + radius / 4,
    pieceY + radius / 4,
    radius,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();
  // 绘制棋子底色
  ctx.beginPath();
  ctx.arc(pieceX, pieceY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 5;
  ctx.fill();
  // 添加高光效果
  const gradient = ctx.createRadialGradient(
    pieceX - radius / 3,
    pieceY - radius / 3,
    radius / 10,
    pieceX,
    pieceY,
    radius
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, .5)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fill();
}

var url = new URL(window.location.href);
var searchParams = new URLSearchParams(url.search);
var roomId = searchParams.get('id');
let RoomID = roomId ? roomId : 10086;
socket.emit('joinRoom', RoomID);

function init() {
  // 可供选择的随机昵称数组
  var nicknames = ["大熊", "飞鸟", "快乐小蜜蜂", "幸运星", "跳跳虎", "迷你巧克力", "热情火焰", "冰雪公主", "小龙虾", "疯狂兔子", "闪闪星", "梦幻猫咪", "笑容阳光", "无敌小飞侠", "甜甜蛋糕", "音乐达人", "露露小丸子", "快乐小鸭子"];
  var randomNickname = nicknames[Math.floor(Math.random() * nicknames.length)] + Math.floor(Math.random() * 100);
  var nicknameInput = document.getElementById("nickname");
  nicknameInput.value = randomNickname;

  addMessage("信息", "欢迎进入简单五子棋游戏！", "系统");

  var sendMessageButton = document.getElementById("send-message");
  var messageInput = document.getElementById("message");
  messageInput.addEventListener("keydown", function (event) {
    if (event.key == "Enter") {
      event.preventDefault();
      sendMessage(event);
    }
  });
  sendMessageButton.addEventListener('click', sendMessage);

  if (color === 'null') {
    $reset.style.display = 'none';
    return;
  }

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / gridSize + 0.5);
    const row = Math.floor(y / gridSize + 0.5);
    if (turn !== color) return;
    if (checkerBoard[row][col].state) return;
    socket.emit('putchess', { row, col });
    event.stopPropagation();
  });

  $reset.addEventListener('click', (event) => {
    socket.emit('reset');
    event.stopPropagation();
  });
}

function sendMessage(event) {
  var nicknameInput = document.getElementById("nickname");
  var message = document.getElementById("message");
  socket.emit('sendMsg', { name: nicknameInput.value, msg: encrypt(message.value), color: (color === 'null' ? '游客' : color === 'black' ? '黑棋' : '白棋') });
  message.value = "";
  event.stopPropagation();
}

function getTime() {
  // 创建一个Date对象
  var currentTime = new Date();
  var hours = currentTime.getHours();
  var minutes = currentTime.getMinutes();
  var seconds = currentTime.getSeconds();
  hours = (hours < 10 ? "0" : "") + hours;
  minutes = (minutes < 10 ? "0" : "") + minutes;
  seconds = (seconds < 10 ? "0" : "") + seconds;
  return hours + ":" + minutes + ":" + seconds;
}

function show() {
  // 棋盘底色
  ctx.fillStyle = '#FFEBCD';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制棋盘
  for (let i = 0; i < SIZE + 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(size, i * gridSize);
    ctx.stroke();
  }
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

// 初始化
socket.on('conn', function (data) {
  color = data.color;
  $mycolor.innerText = "你是：" + (color === 'null' ? '游客' : color === 'black' ? '黑棋' : '白棋') + ',';
  init();
  console.log('conn', data);
});

// 游戏结束
socket.on('gameover', function (data) {
  // 创建弹窗元素
  var modalElement = document.createElement("div");
  modalElement.classList.add("modal", "fade");
  modalElement.innerHTML = `
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-body">
        <h1  style="color:red;">${data}</h1>
      </div>
    </div>
  </div>
`;

  // 添加弹窗到文档中
  document.body.appendChild(modalElement);

  // 显示弹窗
  modalElement.classList.add("show");
  modalElement.style.display = "block";

  // 延时 3 秒后删除弹窗
  setTimeout(function () {
    modalElement.classList.remove("show");
    modalElement.style.display = "none";
    document.body.removeChild(modalElement);
  }, 3000);
});

// 监听聊天消息
socket.on('getMsg', function (data) {
  addMessage(data.name, decrypt(data.msg), data.color)
});

// 获取棋盘
socket.on('getCheckerBoard', function (data) {
  console.log('getCheckerBoard', data);

  checkerBoard = data.checkerboard;
  turn = data.turn;
  $info.innerText = '轮到 ' + (turn === 'black' ? '黑棋' : '白棋') + '落子';
  $num.innerText = '在线人数：' + data.num + ',';

  show();

  for (var i = 0; i < SIZE + 1; i++) {
    for (var j = 0; j < SIZE + 1; j++) {
      if (checkerBoard[i][j].state) {
        drawPiece(i, j, checkerBoard[i][j].type);
      }
    }
  }
});

function addMessage(username, content, color) {
  // 创建消息元素
  var messageDiv = document.createElement("div");
  messageDiv.className = "message";
  var usernameSpan = document.createElement("span");
  usernameSpan.className = "username";
  usernameSpan.innerText = "- [" + color + "] " + username + "：";
  var messageContentSpan = document.createElement("span");
  messageContentSpan.className = "message-content";
  messageContentSpan.innerText = content;
  var timestampSpan = document.createElement("span");
  timestampSpan.className = "timestamp";
  timestampSpan.innerText = getTime();
  timestampSpan.style.marginLeft = "15px";
  messageDiv.appendChild(usernameSpan);
  messageDiv.appendChild(messageContentSpan);
  messageDiv.appendChild(timestampSpan);

  // 获取聊天列表容器
  $chatList.appendChild(messageDiv);
  $chatList.scrollTop = $chatList.scrollHeight;
}

show();

window.addEventListener('beforeunload', function (event) {
  event.returnValue = '确认离开页面吗？';
});