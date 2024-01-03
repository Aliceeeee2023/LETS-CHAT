// 載入資料庫相關模組（需要的時候才引入，沒使用到便可以不引入）
const mysql = require('mysql2/promise');

// 創建 connectionPool，會自動管理資料庫連接
// 也就是 db.query 時，會自動獲取並釋放 connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0
});

// 把 db 這個變數匯出
module.exports = db;