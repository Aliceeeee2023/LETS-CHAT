const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); // 限制 API 請求頻率
const db = require('./database.js');
const jwt = require('jsonwebtoken');

// 限制每秒最多一個請求
const limiter = rateLimit({
    windowMs: 1000, // 1秒
    max: 1, // 每秒最多一個請求
    message: { error: '請避免短時間內多次操作' },
});

// JWT 金鑰設置
const jwtSecretKey = process.env.JWT_SECRET_KEY;

// 處理登入請求
router.put('/api/login', limiter, async (req, res) => {
    const { email, password } = req.body;

    // 驗證資料不可為空
    if (!email || !password) {
        return res.status(400).json({ error: '登入資料不可為空' });
    };

    // 將資料放入資料庫判斷及處理
    try {
        const checkLoginData = 'SELECT id, email, password FROM users WHERE email = ?';
        const LoginResults = await db.query(checkLoginData, [email]);

        // 透過資料長度判斷帳號是否已經註冊
        if (LoginResults[0].length === 0) {
            return res.status(400).json({ error: '查詢不到此帳號' });
        };
        
        // 使用 console.log(Object.keys(LoginResults[0])) 確認屬性名稱為['0']
        let dbId = LoginResults[0]['0'].id;
        let dbEmail = LoginResults[0]['0'].email;
        let dbPassword = LoginResults[0]['0'].password;
        
        if (email === dbEmail && password === dbPassword) {
            // 登入成功後設置 token 並回傳
            const token = jwt.sign({ id: dbId, email: dbEmail }, jwtSecretKey, { expiresIn: '1d' });

            return res.status(200).json({ "token": token });
        } else if (email === dbEmail && password !== dbPassword) {
            return res.status(400).json({ error: '密碼輸入錯誤' });
        };
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

// 判斷是否有登入
// express 中 API 處理可以有多個中間件，如 limiter＆authToken
// 而中間件將在 API 執行前進行，也就是 API 會拿到 authToken 處理好的結果
router.get('/api/login', authToken, async (req, res) => {
    try {
        const checkLoginData = 'SELECT id, email FROM users WHERE email = ?';
        const LoginResults = await db.query(checkLoginData, [req.email]);

        if (LoginResults[0].length === 0) {
            return res.status(400).json({ error: '未登入帳號' });
        }

        return res.status(200).json({ "email": req.email, "userId": req.id});
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

// 用來驗證 token
function authToken(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(400).json({ error: '未登入帳號' });
    };

    jwt.verify(token, jwtSecretKey, (error, decoded) => {
        if (error) {
            return res.status(400).json({ error: '為無效的 token' });
        };

        // 將解碼後的 email 儲存在 req 中，供後續使用
        // 接著呼叫 next() 繼續後續作業  
        req.id = decoded.id;
        req.email = decoded.email;
        next();
    });
};

module.exports = router;