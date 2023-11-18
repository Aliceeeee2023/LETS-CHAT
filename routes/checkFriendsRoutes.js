const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('./database.js');
const jwt = require('jsonwebtoken');

// 限制每秒最多一個請求
const limiter = rateLimit({
    windowMs: 1000,
    max: 1,
    message: { error: '請避免短時間內多次操作' },
});

// JWT 金鑰設置
const jwtSecretKey = process.env.JWT_SECRET_KEY;

// 顯示好友申請列表
router.get('/api/friendStatus', authToken, async (req, res) => {
    try {
        const getFriendRequests = 
        `SELECT users.email
        FROM friend_requests
        JOIN users ON friend_requests.sender_id = users.id
        WHERE friend_requests.receiver_id = ? AND friend_requests.status = "待確認";`;
        const getFriendResult = await db.query(getFriendRequests, [req.id]);

        // 如果無資料表示未有待確認的好友申請
        if (getFriendResult[0].length === 0) {
            return res.status(400).json({ error: '無好友申請' });
        };

        // 回傳待確認的好友申請明細
        let friendEmails = getFriendResult[0].map(entry => entry.email);
        return res.status(200).json({ friendEmails });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

// 顯示好友列表
router.get('/api/showFriendList', authToken, async (req, res) => {
    try {
        // 排除申請＆接收重複的情況，且排除取到自己的 Email
        const getFriendRequests = `
        SELECT DISTINCT users.email
        FROM friend_requests AS fr
        JOIN users ON (LEAST(fr.sender_id, fr.receiver_id) = users.id OR GREATEST(fr.sender_id, fr.receiver_id) = users.id)
        WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = "已確認" AND users.email != ?;`;
        const getFriendResult = await db.query(getFriendRequests, [req.id, req.id, req.email]);

        // 如果無資料表示未有好友
        if (getFriendResult[0].length === 0) {
            return res.status(400).json({ error: '無好友申請' });
        };

        // 回傳好友明細
        let friendEmails = getFriendResult[0].map(entry => entry.email);
        return res.status(200).json({ friendEmails });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

// 驗證 token（並取出登入的 id）
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