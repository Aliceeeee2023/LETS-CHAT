// 載入環境變數（全域可用）
require('dotenv').config();

// 引入 express、HTTP 模組
const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT;
const db = require('./routes/database.js');
const server = require('http').createServer(app);

// 設置靜態路徑
// HTML 中的 CSS、JS 引入路徑就會變成以 public 資料夾為主，如 href="style/index.css"
app.use(express.static(path.join(__dirname, 'public')));

// 處理 JSON 格式資料
app.use(express.json());

// 引入 routes
const authRoutes = require('./routes/authRoutes.js');
const signupRoutes = require('./routes/signupRoutes.js');
const loginRoutes = require('./routes/loginRoutes.js');
const addFriendsRoutes = require('./routes/addFriendsRoutes.js');
const checkFriendsRoutes = require('./routes/checkFriendsRoutes.js');

// 使用 routes（把 routes 放在 '/' 目錄中）
// 假設 authRoutes 裡面有 api 是 api/route，前端就要接 / + api/route
// 也就是把這邊的 / 加上 route 檔案中的 api 路徑連接
app.use('/', authRoutes);
app.use('/', signupRoutes);
app.use('/', loginRoutes);
app.use('/', addFriendsRoutes);
app.use('/', checkFriendsRoutes);

// 設置 WebSocket 伺服器
// 把 HTTP server 傳到 Socket.IO 的 new Server 中（io 物件就是 Socket.IO 伺服器的實例）
const { Server } = require('socket.io');
const io = new Server(server);

// 本次新增（用來設定 Peer.js 伺服器）
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

// 將Peer.js伺服器附加到您的應用程式
// 前端要用 /peerjs 進行銜接
app.use('/peerjs', peerServer);

// 創建一個對象來存儲 currentUserId 與 socket.id 的映射
const userSocketMap = {};
const userPeerMap = {};

io.on('connection', (socket) => {
    console.log('有用戶連接，Socket ID:', socket.id);

    // 先從前端取得ID
    socket.on('set-current-user', (data) => {
        // console.log(data);
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

            // 将消息存储到 MySQL 数据库
            await saveMessageToDatabase(room, currentUserId, currentFriendId , message, currentTime);

            // 將接收到的消息發送給同房間的所有人
            io.to(room).emit('chat message', { room, message, currentUserId, time: currentTime});

            io.to(currentSocketId).emit('update window', { room, message, currentUserId, time: currentTime}); 
            io.to(friendSocketId).emit('update window', { room, message, currentUserId, time: currentTime});            
        } catch (error) {
            console.error('錯誤：', error);

            // 数据库插入失败，向客户端发送失败消息
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

            // 数据库插入失败，向客户端发送失败消息
            socket.emit('chat image', { room, message: '訊息傳送失敗' });
        }
    });

    // 處理前端發送的通話請求
    socket.on('call-request', async ({ currentUserId, currentFriendId }) => {
        try {
            // 在這裡處理通話請求，例如向 friendId 發送通知
            // 這裡僅提供一個基本的示例
            // socket.join(currentRoomId);
            console.log('撥打者ID：' + currentUserId, '朋友ID：' + currentFriendId);
            console.log(userSocketMap);
    
            // 不用管朋友在不在線（因為不能讓對方知道在不在線）
            // 就正常發送請求，然後如果對方沒回應則中斷對話
            const friendSocketId = userSocketMap[currentFriendId];
            
            // 注意：這裡加上了 try-catch 來處理潛在的錯誤
            const friendDataResult = await searchFriendData(currentUserId);
            const callRequestName = friendDataResult[0]['0'].name;
            const callRequestIcon = friendDataResult[0]['0'].icon;
    
            io.to(friendSocketId).emit('incoming-call', { callerId: currentUserId, callName: callRequestName, callIcon: callRequestIcon});
        } catch (error) {
            console.error('處理通話請求時發生錯誤：', error);
            // 在這裡加上其他錯誤處理邏輯，例如發送錯誤通知給用戶等
        }
    });

    // 等待確認中
    socket.on('accept-call', async ({ acceptId, callerId }) => {
        // 處理接受通話的邏輯
        console.log(`${socket.id} accepted the call from ${callerId}`);
        
        // 查找發起通話請求的朋友的 socket.id
        const callerSocketId = userSocketMap[callerId];
        const acceptSocketId = userSocketMap[acceptId];
        const callerPeerId = userPeerMap[callerId];
        const acceptPeerId = userPeerMap[acceptId];       
        console.log(callerSocketId, acceptSocketId);
        console.log('我是'+callerPeerId, acceptPeerId);

        // 如果發起通話請求的朋友在線上，回覆通話接受消息給他
        if (callerSocketId) {
            
            // 通知發起通話的使用者開始建立 WebRTC 連線
            // initiatorId 是用來表示 WebRTC 連接的發起方
            io.to(callerSocketId).emit('start-webrtc-connection', { initiatorId: callerSocketId, acceptId: acceptSocketId, isCaller: true, callerPeerId: callerPeerId, acceptPeerId: acceptPeerId});

            // 通知接受通話的使用者開始建立 WebRTC 連線
            io.to(acceptSocketId).emit('start-webrtc-connection', { initiatorId: callerSocketId, acceptId: acceptSocketId, isCaller: false, callerPeerId: callerPeerId, acceptPeerId: acceptPeerId });
 
        }
    });

    socket.on('hangup-call', async ({ callRequestId, callAcceptId }) => {
        // if (callRequestId) {
        //     io.to(callRequestId).emit('hangup-other-call');
        // }
        io.to(callRequestId).emit('hangup-other-call');
        io.to(callAcceptId).emit('hangup-other-call');
    });

    socket.on('cancel-call', async ({ currentFriendId }) => {
        const friendSocketId = userSocketMap[currentFriendId];
        if (friendSocketId) {
            io.to(friendSocketId).emit('cancel-other-call');
        }
    });

    socket.on('reject-call', async ({ currentCallerId }) => {
        console.log(currentCallerId);
        const friendSocketId = userSocketMap[currentCallerId];
        if (friendSocketId) {
            io.to(friendSocketId).emit('reject-other-call');
        }
    });

    // peer 相關
    socket.on('peer-id', (data) => {
        const peerId = data.peerId;
        const currentUserId = data.currentUserId;
        console.log('有用戶連接，Peer ID: ' + peerId);

        userPeerMap[currentUserId] = peerId;
    });

    socket.on('disconnect', () => {
        console.log('用戶斷開連接:', socket.id);
        // 刪除斷開連接的用戶映射

        // 在 disconnect 時訪問 currentUserId
        const currentUserId = socket.currentUserId;

        delete userSocketMap[currentUserId];
        delete userPeerMap[currentUserId];
    });
});

// S3相關（確認中）
// 上傳檔案到 S3 的相關設置
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const s3BucketName = process.env.AWS_S3_BUCKET_NAME;

// 檔案上傳相關設定
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 設置 AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// 將訊息存到資料庫
async function saveMessageToDatabase(room, currentUserId, currentFriendId, message, currentTime) {
		const query = 'INSERT INTO messages (room, sender_id, receiver_id, message, time) VALUES (?, ?, ?, ?, ?)';
		const getFriendResult = await db.query(query, [room, currentUserId, currentFriendId, message, currentTime]);
}

// 取出來電朋友的資料
async function searchFriendData(currentFriendId) {
    const query = 'SELECT name, icon FROM users WHERE id = ?';
    const getFriendResult = await db.query(query, [currentFriendId]);

    return getFriendResult;
}

server.listen(port, () => {
    console.log(`Server is running, URL is http://localhost:${port}`);
});