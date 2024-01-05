require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT;
const server = require('http').createServer(app);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const db = require('./modules/database.js');
const authRoutes = require('./modules/authRoutes.js');
const signupRoutes = require('./routes/signupRoutes.js');
const loginRoutes = require('./routes/loginRoutes.js');
const addFriendsRoutes = require('./routes/addFriendsRoutes.js');
const checkFriendsRoutes = require('./routes/checkFriendsRoutes.js');

const { Server } = require('socket.io');
const io = new Server(server);

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.use('/', authRoutes);
app.use('/', signupRoutes);
app.use('/', loginRoutes);
app.use('/', addFriendsRoutes);
app.use('/', checkFriendsRoutes);
app.use('/peerjs', peerServer);


async function saveMessageToDatabase(room, currentUserId, currentFriendId, message, currentTime) {
	const query = 'INSERT INTO messages (room, sender_id, receiver_id, message, time) VALUES (?, ?, ?, ?, ?)';
	const getFriendResult = await db.query(query, [room, currentUserId, currentFriendId, message, currentTime]);
}
async function searchFriendData(currentFriendId) {
    const query = 'SELECT name, icon FROM users WHERE id = ?';
    const getFriendResult = await db.query(query, [currentFriendId]);

    return getFriendResult;
}


const userSocketMap = {};
const userPeerMap = {};

io.on('connection', (socket) => {
    console.log('有用戶連接，Socket ID:', socket.id);

    socket.on('set-current-user', (data) => {
        const { currentUserId } = data;

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
            const currentTime = new Date();
            const currentSocketId = userSocketMap[currentUserId];
            const friendSocketId = userSocketMap[currentFriendId];

            await saveMessageToDatabase(room, currentUserId, currentFriendId , message, currentTime);

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
            const currentTime = new Date();
            const currentSocketId = userSocketMap[currentUserId];
            const friendSocketId = userSocketMap[currentFriendId];

            io.to(room).emit('chat image', { room, fileURL, currentUserId, time: currentTime});
            io.to(currentSocketId).emit('update window pic', { room, fileURL, currentUserId, time: currentTime}); 
            io.to(friendSocketId).emit('update window pic', { room, fileURL, currentUserId, time: currentTime}); 
        } catch (error) {
            console.error('錯誤：', error);
            socket.emit('chat image', { room, message: '訊息傳送失敗' });
        }
    });

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

    socket.on('call-request', async ({ currentUserId, currentFriendId }) => {
        try {
            console.log('撥打者ID：' + currentUserId, '朋友ID：' + currentFriendId);

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
            
            const callerSocketId = userSocketMap[callerId];
            const acceptSocketId = userSocketMap[acceptId];
            const callerPeerId = userPeerMap[callerId];
            const acceptPeerId = userPeerMap[acceptId];

            if (callerSocketId) {
                io.to(callerSocketId).emit('start-webrtc-connection', { initiatorId: callerSocketId, acceptId: acceptSocketId, isCaller: true, callerPeerId: callerPeerId, acceptPeerId: acceptPeerId});
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