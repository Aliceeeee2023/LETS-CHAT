// 載入環境變數（全域可用）
require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT;
const server = require('http').createServer(app);

// 設置靜態路徑（CSS、JS 引入路徑就會變成以 public 資料夾為主，如 href="style/index.css"）
app.use(express.static(path.join(__dirname, 'public')));
// 處理 JSON 格式資料
app.use(express.json());

// 引入 自訂模組 + API
const db = require('./modules/database.js');
const authRoutes = require('./modules/authRoutes.js');
const signupRoutes = require('./routes/signupRoutes.js');
const loginRoutes = require('./routes/loginRoutes.js');
const addFriendsRoutes = require('./routes/addFriendsRoutes.js');
const checkFriendsRoutes = require('./routes/checkFriendsRoutes.js');

// 設置 WebSocket + Peer.js 伺服器
// 把 HTTP server 傳到 Socket.IO/peer 的 Server 中（像io 物件就是 Socket.IO 伺服器的實例）
const { Server } = require('socket.io');
const io = new Server(server);

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

// 使用中間件把 API 添加到 root 路徑後
// 假設 API 是 "api/signup"，前端 CALL 的時候就要寫 "/api/route"
app.use('/', authRoutes);
app.use('/', signupRoutes);
app.use('/', loginRoutes);
app.use('/', addFriendsRoutes);
app.use('/', checkFriendsRoutes);
app.use('/peerjs', peerServer);


// 資料庫相關操作
async function saveMessageToDatabase(room, currentUserId, currentFriendId, message, currentTime) {
	const query = 'INSERT INTO messages (room, sender_id, receiver_id, message, time) VALUES (?, ?, ?, ?, ?)';
	const getFriendResult = await db.query(query, [room, currentUserId, currentFriendId, message, currentTime]);
}
async function searchFriendData(currentFriendId) {
    const query = 'SELECT name, icon FROM users WHERE id = ?';
    const getFriendResult = await db.query(query, [currentFriendId]);

    return getFriendResult;
}


// 即時文字、語音處理
// 創建一個對象來存儲 currentUserId 與 socket.id 的映射
const userSocketMap = {};
const userPeerMap = {};

io.on('connection', (socket) => {
    console.log('有用戶連接，Socket ID:', socket.id);

    // 先從前端取得ID
    socket.on('set-current-user', (data) => {
        const { currentUserId } = data;

        // 將 currentUserId 與 socket.id 進行映射
        userSocketMap[currentUserId] = socket.id;
        console.log('用戶', currentUserId, '已連接');
    });

    socket.on('join room', (data) => {
        const { room } = data;
        socket.join(room);
        console.log(`用戶 ${socket.id} 加入房間：${room}`);

    });

    socket.on('chat message', async (data) => {
        const { room, currentUserId, currentFriendId, message } = data;
        console.log(`用戶 ${socket.id} 在房間 ${room} 發送消息：${message}`);
        
		try {
            // 獲取當前時間
            const currentTime = new Date();
            const currentSocketId = userSocketMap[currentUserId];
            const friendSocketId = userSocketMap[currentFriendId];

            // 将訊息資料存入資料庫
            await saveMessageToDatabase(room, currentUserId, currentFriendId , message, currentTime);

            // 將接收到的消息發送給同房間的所有人
            io.to(room).emit('chat message', { room, message, currentUserId, time: currentTime});

            io.to(currentSocketId).emit('update window', { room, message, currentUserId, time: currentTime}); 
            io.to(friendSocketId).emit('update window', { room, message, currentUserId, time: currentTime});            
        } catch (error) {
            console.error('錯誤：', error);
            socket.emit('chat message', { room, message: '訊息傳送失敗' });
        }
    });

    socket.on('chat image', async (data) => {
        const { room, currentUserId, currentFriendId, fileURL } = data;
        console.log(`用戶 ${socket.id} 在房間 ${room} 發送消息：${fileURL}`);
        
		try {
            // 獲取當前時間
            const currentTime = new Date();
            const currentSocketId = userSocketMap[currentUserId];
            const friendSocketId = userSocketMap[currentFriendId];

            // 將接收到的消息發送給同房間的所有人
            io.to(room).emit('chat image', { room, fileURL, currentUserId, time: currentTime});

            io.to(currentSocketId).emit('update window pic', { room, fileURL, currentUserId, time: currentTime}); 
            io.to(friendSocketId).emit('update window pic', { room, fileURL, currentUserId, time: currentTime}); 
        } catch (error) {
            console.error('錯誤：', error);
            socket.emit('chat image', { room, message: '訊息傳送失敗' });
        }
    });

    // 將 peerID 加入比對
    socket.on('peer-id', (data) => {
        try {
            const peerId = data.peerId;
            const currentUserId = data.currentUserId;
            console.log('有用戶連接，Peer ID: ' + peerId);

            userPeerMap[currentUserId] = peerId;
        } catch (error) {
            console.error('處理通話請求時發生錯誤：', error);
        }
    });

    // 處理通話請求
    socket.on('call-request', async ({ currentUserId, currentFriendId }) => {
        try {
            console.log('撥打者ID：' + currentUserId, '朋友ID：' + currentFriendId);

            // 不用管朋友在不在線（因為不能讓對方知道在不在線），正常發送請求，如果對方沒回應則中斷
            const friendSocketId = userSocketMap[currentFriendId];
            const friendDataResult = await searchFriendData(currentUserId);
            const callRequestName = friendDataResult[0]['0'].name;
            const callRequestIcon = friendDataResult[0]['0'].icon;
    
            io.to(friendSocketId).emit('incoming-call', { callerId: currentUserId, callName: callRequestName, callIcon: callRequestIcon});
        } catch (error) {
            console.error('處理通話請求時發生錯誤：', error);
        }
    });

    socket.on('accept-call', async ({ acceptId, callerId }) => {
        try {        
            console.log(`${socket.id} accepted the call from ${callerId}`);
            
            // 查找發起通話請求的朋友的 socket.id
            const callerSocketId = userSocketMap[callerId];
            const acceptSocketId = userSocketMap[acceptId];
            const callerPeerId = userPeerMap[callerId];
            const acceptPeerId = userPeerMap[acceptId];

            // 如果發起通話請求的朋友在線上，則開始進行通話
            if (callerSocketId) {
                // 通知發起通話的使用者開始建立 WebRTC 連線
                // initiatorId 是用來表示 WebRTC 連接的發起方
                io.to(callerSocketId).emit('start-webrtc-connection', { initiatorId: callerSocketId, acceptId: acceptSocketId, isCaller: true, callerPeerId: callerPeerId, acceptPeerId: acceptPeerId});

                // 通知接受通話的使用者開始建立 WebRTC 連線
                io.to(acceptSocketId).emit('start-webrtc-connection', { initiatorId: callerSocketId, acceptId: acceptSocketId, isCaller: false, callerPeerId: callerPeerId, acceptPeerId: acceptPeerId });
            }
        } catch (error) {
            console.error('處理通話請求時發生錯誤：', error);
        }
    });

    socket.on('hangup-call', async ({ callRequestId, callAcceptId }) => {
        try {        
            io.to(callRequestId).emit('hangup-other-call');
            io.to(callAcceptId).emit('hangup-other-call');
        } catch (error) {
            console.error('處理通話請求時發生錯誤：', error);
        }
    });

    socket.on('cancel-call', async ({ currentFriendId }) => {
        try {
            const friendSocketId = userSocketMap[currentFriendId];
            if (friendSocketId) {
                io.to(friendSocketId).emit('cancel-other-call');
            }
        } catch (error) {
            console.error('處理通話請求時發生錯誤：', error);
        }
    });

    socket.on('reject-call', async ({ currentCallerId }) => {
        try {
            const friendSocketId = userSocketMap[currentCallerId];
            if (friendSocketId) {
                io.to(friendSocketId).emit('reject-other-call');
            }
        } catch (error) {
            console.error('處理通話請求時發生錯誤：', error);
        }
    });

    socket.on('disconnect', () => {
        try {
            console.log('用戶斷開連接:', socket.id);
            // 刪除斷開連接的用戶
            const currentUserId = socket.currentUserId;

            delete userSocketMap[currentUserId];
            delete userPeerMap[currentUserId];
        } catch (error) {
            console.error('處理通話請求時發生錯誤：', error);
        }
    });
});

server.listen(port, () => {
    console.log(`Server is running, URL is http://localhost:${port}`);
});