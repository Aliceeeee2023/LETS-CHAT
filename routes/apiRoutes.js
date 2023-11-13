const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); // 限制 API 請求頻率
const db = require('./database.js');

// 限制每秒最多一個請求
const limiter = rateLimit({
    windowMs: 1000, // 1秒
    max: 1, // 每秒最多一個請求
    message: { error: '請避免短時間內多次操作' },
});

// 驗證電子郵件及密碼格式
function checkEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

function checkPassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
    return passwordRegex.test(password);
};

// 處理註冊請求（POST）
router.post('/api/signup', limiter, async (req, res) => {
    // 提取值後賦值給 email, password 兩個變數
    const { email, password } = req.body;

    // 驗證電子郵件和密碼格式
    if (!email || !password) {
        return res.status(400).json({ error: '註冊資料不可為空' });
    } else if (!checkEmail(email)) {
        return res.status(400).json({ error: '無效的電子郵件格式' });
    } else if (!checkPassword(password)) {
        return res.status(400).json({ error: '無效的密碼格式' });
    };

    // 將資料放入資料庫判斷及處理
    try {
        const checkEmailExist = 'SELECT * FROM users WHERE email = ?';
        const emailExistResults = await db.query(checkEmailExist, [email]);

        // 取出資料中的[0]才是實際資料
        if (emailExistResults[0].length > 0) {
            return res.status(400).json({ error: '電子郵件地址已存在' });
        } else {
            const insertUser = 'INSERT INTO users (email, password) VALUES (?, ?)';
            await db.query(insertUser, [email, password]);

            return res.status(200).json({ ok: true });
        };
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

module.exports = router;