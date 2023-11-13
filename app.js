// 載入環境變數（全域可用）
require('dotenv').config();

// 引入 express、HTTP 模組
const express = require('express')
const app = express();
const path = require('path');
const port = process.env.PORT;
const server = require('http').createServer(app);

// 設置靜態路徑
// HTML 中的 CSS、JS 引入路徑就會變成以 public 資料夾為主，如 href="style/index.css"
app.use(express.static(path.join(__dirname, 'public')));

// 處理 JSON 格式資料
app.use(express.json());

// 引入 routes
const authRoutes = require('./routes/authRoutes.js');
const apiRoutes = require('./routes/apiRoutes.js');

// 使用 routes（把 routes 放在 '/' 目錄中）
app.use('/', authRoutes);
app.use('/', apiRoutes);

// 設置伺服器（不能用 app.listen 函數，不然會仍然使用 HTTP 進行交互）
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', socket => {
    console.log('New Connection');

    socket.on('chat message', msg => {
        console.log(msg);

        // 把接收到的訊息發送給所有人
        io.emit('chat message', msg);
    })

    socket.on('disconnect', () => {
        console.log('Connection Close');
    });
});

server.listen(port, () => {
    console.log('Server is running, URL is http://localhost:' + `${port}`);
});