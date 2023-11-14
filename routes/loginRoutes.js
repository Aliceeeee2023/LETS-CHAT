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

// 處理登入請求（PUT）
router.put('/api/login', limiter, async (req, res) => {
    const { email, password } = req.body;

    // 驗證資料不可為空
    if (!email || !password) {
        return res.status(400).json({ error: '登入資料不可為空' });
    };

    // 將資料放入資料庫判斷及處理
    try {
        const checkLoginData = 'SELECT email, password FROM users WHERE email = ?';
        const LoginResults = await db.query(checkLoginData, [email]);

        // 透過資料長度判斷帳號是否已經註冊
        if (LoginResults[0].length === 0) {
            return res.status(400).json({ error: '查詢不到此帳號' });
        };
        
        // 使用 console.log(Object.keys(LoginResults[0])) 確認屬性名稱為['0']
        let dbEmail = LoginResults[0]['0'].email;
        let dbPassword = LoginResults[0]['0'].password;
        
        if (email === dbEmail && password === dbPassword) {
            return res.status(200).json({ ok: true });
        } else if (email === dbEmail && password !== dbPassword) {
            return res.status(400).json({ error: '密碼輸入錯誤' });
        };
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

module.exports = router;