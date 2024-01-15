
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // 从 localStorage 中获取昵称，如果不存在则使用默认昵称
    const getNickname = () => {
        let nickname = localStorage.getItem('nickname');
        if (!nickname) {
            const nicknames = [
                "大熊", "飞鸟", "快乐小蜜蜂", "幸运星", "跳跳虎", "迷你巧克力", "热情火焰",
                "冰雪公主", "小龙虾", "疯狂兔子", "闪闪星", "梦幻猫咪", "笑容阳光", "无敌小飞侠",
                "甜甜蛋糕", "音乐达人", "露露小丸子", "快乐小鸭子"
            ];
            nickname = nicknames[Math.floor(Math.random() * nicknames.length)] + Math.floor(Math.random() * 100);
        }
        return nickname;
    };

    // 设置昵称
    const setNickname = () => {
        const nickname = prompt('请输入您的昵称:', getNickname());
        if (nickname) {
            localStorage.setItem('nickname', nickname);
        }
        return nickname;
    };

    // 创建房间按钮点击事件处理程序
    const createRoomButton = document.getElementById('create-room-button');
    createRoomButton.classList.add('btn', 'btn-primary');
    createRoomButton.addEventListener('click', () => {
        const nickname = setNickname();
        if (nickname) {
            const roomName = prompt('请输入房间名称:');
            if (roomName) {
                location.href = "main.html?id=" + roomName;
            }
        }
    });

    // 更新房间列表
    const updateRoomList = (roomsData) => {
        const roomListContainer = document.getElementById('room-list-container');
        roomListContainer.innerHTML = ''; // 清空房间列表

        // 遍历房间数据
        roomsData.forEach((roomData) => {
            // 创建房间项
            const roomItem = document.createElement('div');
            roomItem.classList.add('room-item', 'bg-light', 'p-3', 'my-2', 'd-flex', 'align-items-center', 'justify-content-between');

            // 创建房间名称元素
            const roomName = document.createElement('span');
            roomName.textContent = roomData.name;
            roomItem.appendChild(roomName);

            // 创建人数元素
            const numMembers = document.createElement('span');
            numMembers.textContent = `人数: ${roomData.numMembers}`;
            roomItem.appendChild(numMembers);

            // 创建加入按钮
            const joinButton = document.createElement('button');
            joinButton.textContent = '加入';
            joinButton.classList.add('btn', 'btn-secondary');
            joinButton.addEventListener('click', () => {
                const nickname = setNickname();
                if (nickname) {
                    location.href = "main.html?id=" + roomData.name;
                }
            });
            roomItem.appendChild(joinButton);

            // 将房间项添加到房间列表容器中
            roomListContainer.appendChild(roomItem);
        });
    };

    // 监听房间更新事件
    socket.on('updateRooms', (roomsData) => {
        updateRoomList(roomsData);
    });

    socket.emit('getRooms');

    setInterval(() => {
        socket.emit('getRooms');
    }, 5000);
});