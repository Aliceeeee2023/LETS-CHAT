// 載入環境變數（全域可用）
require('dotenv').config();

// 引入 express、HTTP 模組
const express = require('express')
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
app.use('/', authRoutes);
app.use('/', signupRoutes);
app.use('/', loginRoutes);
app.use('/', addFriendsRoutes);
app.use('/', checkFriendsRoutes);

// 設置 WebSocket 伺服器
// 把 HTTP server 傳到 Socket.IO 的 new Server 中（io 物件就是 Socket.IO 伺服器的實例）
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('有用戶連接');

    socket.on('join room', (data) => {
        const { room } = data;
        socket.join(room);
        console.log(`用戶 ${socket.id} 加入房間：${room}`);
    });

    socket.on('chat message', async (data) => {
        const { room, currentUserId, currentFriendId, message } = data;
        console.log(`用戶 ${socket.id} 在房間 ${room} 發送消息：${message}`);
        
		try {
            // 将消息存储到 MySQL 数据库
            await saveMessageToDatabase(room, currentUserId, currentFriendId , message);

            // 將接收到的消息發送給同房間的所有人
            io.to(room).emit('chat message', { room, message, currentUserId});
        } catch (error) {
            console.error('錯誤：', error);

            // 数据库插入失败，向客户端发送失败消息
            socket.emit('chat message', { room, message: '訊息傳送失敗' });
        }
    });

    // socket.on('chat message', msg => {
    //     console.log(msg);

    //     // 把接收到的訊息發送給所有人
    //     io.emit('chat message', msg);
    // })

    socket.on('disconnect', () => {
        console.log('Connection Close');
    });
});

// 將訊息存到資料庫
async function saveMessageToDatabase(room, currentUserId, currentFriendId, message) {
		const query = 'INSERT INTO messages (room, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)';
		const getFriendResult = await db.query(query, [room, currentUserId, currentFriendId, message]);
}

// 等待確認中
// io.on('connection', (socket) => {
//     console.log('User connected');
  
//     // Handle join room event
//     socket.on('join', (roomId) => {
//       socket.join(roomId);
//     });
  
//     // Handle message event
//     socket.on('message', async (data) => {
//       try {
//         // Insert message into the database
//         const connection = await pool.getConnection();
//         const [rows, fields] = await connection.execute(
//           'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
//           [data.sender_id, data.receiver_id, data.content]
//         );
//         connection.release();
  
//         const messageId = rows.insertId;
  
//         // Retrieve the inserted message
//         const [messageRows] = await pool.execute(
//           'SELECT * FROM messages WHERE id = ?',
//           [messageId]
//         );
  
//         const message = messageRows[0];
  
//         // Emit the message to the receiver
//         io.to(data.receiver_id).emit('message', message);
//       } catch (error) {
//         console.error('Error saving message to the database:', error);
//       }
//     });
  
//     // Handle disconnect event
//     socket.on('disconnect', () => {
//       console.log('User disconnected');
//     });
//   });

server.listen(port, () => {
    console.log(`Server is running, URL is http://localhost:${port}`);
});