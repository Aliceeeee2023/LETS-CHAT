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

// 添加好友邏輯
router.post('/api/addFriend', authToken, async (req, res) => {
    let { friendEmail } = req.body;

    if (req.email === friendEmail) {
        return res.status(400).json({ error: '請勿輸入自己的帳號' });
    };

    try {  
        // 分成查詢不到帳號、有查詢到且已有好友紀錄（且分狀態）、有查詢到無好友紀錄（新增資料）
        const findFriendQuery = 
        `SELECT u.id AS friendId, fr.status AS friendRequestStatus
        FROM users u
        LEFT JOIN friend_requests fr ON fr.receiver_id = u.id AND fr.sender_id = ?
        WHERE u.email = ? `;
        const checkFriendResults = await db.query(findFriendQuery, [req.id, friendEmail]);

        if (checkFriendResults[0].length === 0) {
            return res.status(400).json({ error: '查詢不到此帳號' });
        };

        const friendId = checkFriendResults[0]['0'].friendId;
        const friendRequestStatus = checkFriendResults[0]['0'].friendRequestStatus;

        if (friendRequestStatus === '待確認') {
            return res.status(400).json({ error: '等待對方回覆' });
        } else if (friendRequestStatus === '已拒絕') {
            return res.status(400).json({ error: '等待對方回覆' }); // 不讓當事者知道被封鎖
        } else if (friendRequestStatus === '已確認') {
            return res.status(400).json({ error: '雙方已為好友' });
        };

        // 有查到帳號但好友申請無紀錄，則 INSERT
        const addFriendQuery = 'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)';
        const addFriendResults = await db.query(addFriendQuery, [req.id, friendId, '待確認']);

        return res.status(200).json({ message: '已送出好友申請' });
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