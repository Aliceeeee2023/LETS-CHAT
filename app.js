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

io.on('connection', (socket) => {
    console.log('有用戶連接，Socket ID:', socket.id);
    // const currentUserId = socket.handshake.query.currentUserId;
    // userSocketMap[currentUserId] = socket.id;
    // console.log('用戶', currentUserId, '已連接');

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

        // // 11/28新增★★★
        // roomToSocketMap[room] = roomToSocketMap[room] || [];
        // roomToSocketMap[room].push(socket.id);
    });

    socket.on('chat message', async (data) => {
        const { room, currentUserId, currentFriendId, message } = data;
        console.log(`用戶 ${socket.id} 在房間 ${room} 發送消息：${message}`);
        
		try {
            // 獲取當前時間
            const currentTime = new Date();

            // 将消息存储到 MySQL 数据库
            await saveMessageToDatabase(room, currentUserId, currentFriendId , message);

            // 將接收到的消息發送給同房間的所有人
            io.to(room).emit('chat message', { room, message, currentUserId, time: currentTime});
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

            // 將接收到的消息發送給同房間的所有人
            io.to(room).emit('chat image', { room, fileURL, currentUserId, time: currentTime});
        } catch (error) {
            console.error('錯誤：', error);

            // 数据库插入失败，向客户端发送失败消息
            socket.emit('chat image', { room, message: '訊息傳送失敗' });
        }
    });

    // 處理前端發送的通話請求
    socket.on('call-request', ({ currentUserId, currentFriendId }) => {
        // 在這裡處理通話請求，例如向 friendId 發送通知
        // 這裡僅提供一個基本的示例
        // socket.join(currentRoomId);
        console.log('撥打者ID：' + currentUserId, '朋友ID：' + currentFriendId);

        // 不用管朋友在不在線（因為不能讓對方知道在不在線）
        // 就正常發送請求，然後如果對方沒回應則中斷對話
        const friendSocketId = userSocketMap[currentFriendId];
        io.to(friendSocketId).emit('incoming-call', { callerId: currentUserId });
    });

    // 等待確認中
    // 等待確認中
    socket.on('accept-call', async ({ acceptId, callerId }) => {
        // 處理接受通話的邏輯
        console.log(`${socket.id} accepted the call from ${callerId}`);
        
        // 查找發起通話請求的朋友的 socket.id
        const callerSocketId = userSocketMap[callerId];
        const acceptSocketId = userSocketMap[acceptId];
        console.log(callerSocketId, acceptSocketId)

        // 如果發起通話請求的朋友在線上，回覆通話接受消息給他
        if (callerSocketId) {
            
            // 通知發起通話的使用者開始建立 WebRTC 連線
            // initiatorId 是用來表示 WebRTC 連接的發起方
            io.to(callerSocketId).emit('start-webrtc-connection', { initiatorId: callerSocketId, acceptId: acceptSocketId });

            // 通知接受通話的使用者開始建立 WebRTC 連線
            io.to(acceptSocketId).emit('start-webrtc-connection', { initiatorId: callerSocketId, acceptId: acceptSocketId });
 
        }
    });

    socket.on('hangup-call', async ({ callRequestId }) => {
        if (callRequestId) {
            io.to(callRequestId).emit('hangup-other-call');
        }
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






    // socket.on('call-request', (data) => {
    //     const { room, peerId } = data;
    //     console.log(`用戶 ${socket.id} 在房間 ${room} 發起通話請求給 ${peerId}`);

    //     // 向房间中的其他用户发出通话请求
    //     socket.to(room).emit('call-request', { peerId });
    // });

    // socket.on('call-response', (data) => {
    //     const { peerId, isAccepted } = data;
    
    //     if (isAccepted) {
    //         // 对方接受通话
    //         // 发送通话已接受的消息给对方，告知开始建立 WebRTC 连接
    //         socket.to(peerId).emit('call-accepted', { peerId: socket.id });
    //     } else {
    //         // 对方拒绝通话
    //         // 可以在这里处理拒绝通话的逻辑
    //     }
    // });
    
    // // 处理对方已接受通话的事件
    // socket.on('call-accepted', (data) => {
    //     const { peerId } = data;
    
    //     // 在这里可以进行 WebRTC 连接的建立，例如通过 Peer.js
    //     // ...
    // });

    // // 發起語音呼叫
    // // friendPeerId 為朋友的 peer ID
    // socket.on('call friend', (friendPeerId) => {
    //     // 使用Peer.js 向朋友（peer ID）發起呼叫
    //     // call 方法表示發起通話，friendPeerId 代表要通話的朋友 ID，null 表示僅傳輸聲音
    //     const call = peer.call(friendPeerId, null);
    //     // 如果要傳輸影像，則需要用 const call = peer.call(friendPeerId, yourMediaStream);

    //     call.on('stream', (friendStream) => {
    //         // 將朋友的音頻流發送給原始呼叫方
    //         io.to(socket.id).emit('friend stream', friendStream);
    //     });
    // });

    // // 發起結束通話的事件
    // socket.on('end call', () => {
    //     // 可在此處添加處理結束通話的邏輯
    //     // 例如：關閉音訊/視訊流、結束 Peer.js 通話等
    
    //     // 通知所有用戶結束通話
    //     io.emit('end call');
    // });

    socket.on('disconnect', () => {
        console.log('用戶斷開連接:', socket.id);
        // 刪除斷開連接的用戶映射

        // 在 disconnect 時訪問 currentUserId
        const currentUserId = socket.currentUserId;

        delete userSocketMap[currentUserId];
    });
});



// 關於ID比對
// io.on('connection', (socket) => {
//     // 當有新連接時，建立一個用戶 ID 並與套接字關聯
//     const userId = generateUniqueId(); // 假設有一個生成唯一 ID 的函數
//     socket.userId = userId;

//     // 將新用戶添加到用戶數據庫
//     users[userId] = { socket: socket, /* 其他用戶信息 */ };

//     // 發送用戶 ID 到前端
//     socket.emit('user-id', { userId });

//     // 其他後端邏輯...

//     // 在套接字斷開連接時的處理
//     socket.on('disconnect', () => {
//         console.log('用戶斷開連接:', socket.userId);
//         // 從用戶數據庫中刪除斷開連接的用戶
//         delete users[socket.userId];
//     });

//     // 處理通話請求
//     socket.on('call-request', ({ currentFriendId }) => {
//         // 確保 currentFriendId 是有效的用戶 ID
//         if (users[currentFriendId]) {
//             // 在這裡處理通話請求，通知朋友
//             users[currentFriendId].socket.emit('incoming-call', { callerId: socket.userId });
//         } else {
//             console.error('無效的朋友 ID:', currentFriendId);
//         }
//     });
// });

// // 生成唯一 ID 的示例函數
// function generateUniqueId() {
//     // 實際應用中，可能使用更複雜的邏輯生成唯一 ID
//     return Math.random().toString(36).substring(2, 15);
// }















// 第二版本
// io.on('connection', (socket) => {
//     console.log(`User connected: ${socket.id}`);

//     // 监听通话请求
//     socket.on('call-request', (data) => {
//         const { friendId } = data;
//         console.log(`Incoming call request from ${socket.id} to ${friendId}`);

//         // 向朋友发送通话请求
//         io.to(friendId).emit('call-request');
//     });

//     // 监听通话取消
//     socket.on('call-cancel', () => {
//         console.log(`Call cancelled by ${socket.id}`);
//         // 取消通话逻辑
//         // ...
//     });

//     // 监听通话接受
//     socket.on('call-accept', () => {
//         console.log(`Call accepted by ${socket.id}`);
//         // 通话接受逻辑
//         // ...
//     });

//     // 监听通话拒绝
//     socket.on('call-reject', () => {
//         console.log(`Call rejected by ${socket.id}`);
//         // 通话拒绝逻辑
//         // ...
//     });

//     // 监听通话结束
//     socket.on('call-end', () => {
//         console.log(`Call ended by ${socket.id}`);
//         // 通话结束逻辑
//         // ...
//     });

//     socket.on('disconnect', () => {
//         console.log('User disconnected');
//         // 用户断开连接逻辑
//         // ...
//     });
// });


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
async function saveMessageToDatabase(room, currentUserId, currentFriendId, message) {
		const query = 'INSERT INTO messages (room, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)';
		const getFriendResult = await db.query(query, [room, currentUserId, currentFriendId, message]);
}

server.listen(port, () => {
    console.log(`Server is running, URL is http://localhost:${port}`);
});