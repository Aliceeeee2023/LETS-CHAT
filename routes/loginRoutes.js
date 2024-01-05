const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../modules/database.js');
const jwt = require('jsonwebtoken');

const limiter = rateLimit({
    windowMs: 1000,
    max: 1,
    message: { error: '請避免短時間內多次操作' },
});

const jwtSecretKey = process.env.JWT_SECRET_KEY;

router.put('/api/login', limiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: '登入資料不可為空' });
    };

    try {
        const checkLoginData = 'SELECT id, email, password FROM users WHERE email = ?';
        const LoginResults = await db.query(checkLoginData, [email]);

        if (LoginResults[0].length === 0) {
            return res.status(400).json({ error: '查詢不到此帳號' });
        };
        
        let dbId = LoginResults[0]['0'].id;
        let dbEmail = LoginResults[0]['0'].email;
        let dbPassword = LoginResults[0]['0'].password;

        if (email === dbEmail && password === dbPassword) {
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

router.get('/api/login', authToken, async (req, res) => {
    try {
        const checkLoginData = 'SELECT id, name, email, icon FROM users WHERE email = ?';
        const LoginResults = await db.query(checkLoginData, [req.email]);

        if (LoginResults[0].length === 0) {
            return res.status(400).json({ error: '未登入帳號' });
        }

        let dbId = LoginResults[0]['0'].id;
        let dbName = LoginResults[0]['0'].name;
        let dbEmail = LoginResults[0]['0'].email;
        let dbIcon = LoginResults[0]['0'].icon;

        return res.status(200).json({ "email": dbEmail, "name": dbName, "userId": dbId, "icon": dbIcon});
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

function authToken(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(400).json({ error: '未登入帳號' });
    };

    jwt.verify(token, jwtSecretKey, (error, decoded) => {
        if (error) {
            return res.status(400).json({ error: '為無效的 token' });
        };

        req.id = decoded.id;
        req.email = decoded.email;
        next();
    });
};

module.exports = router;