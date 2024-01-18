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

router.get('/api/showFriendList', authToken, async (req, res) => {
    try {
        const getFriendRequests = `
        SELECT DISTINCT users.id AS friendId, users.name, users.icon, users.status, fr.id
        FROM friend_requests AS fr
        JOIN users ON (LEAST(fr.sender_id, fr.receiver_id) = users.id OR GREATEST(fr.sender_id, fr.receiver_id) = users.id)
        WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = "已確認" AND users.email != ?
        ORDER BY users.name COLLATE utf8mb4_unicode_ci;`;
        const getFriendResult = await db.query(getFriendRequests, [req.id, req.id, req.email]);

        if (getFriendResult[0].length === 0) {
            return res.status(400).json({ error: '無好友申請' });
        };

        let friendEmails = getFriendResult[0].map(entry => ({ friendId: entry.friendId, name: entry.name, icon: entry.icon, status: entry.status ,roomId: entry.id }));
        return res.status(200).json({ friendEmails });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

router.get('/api/getMessageList', authToken, async (req, res) => {
    try {
        const getMessageList = 
        `WITH RankedMessages AS (
            SELECT
                u.id, u.icon, u.name, u.email, u.status, m.room, m.message, m.time,
                ROW_NUMBER() OVER (PARTITION BY CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END ORDER BY m.time DESC) AS rnk
            FROM messages m
            JOIN users u ON (m.sender_id = u.id AND m.receiver_id = ?) OR (m.receiver_id = u.id AND m.sender_id = ?)
        )
        SELECT id, email, icon, name, status, room, message, time
        FROM RankedMessages
        WHERE rnk = 1
        ORDER BY time DESC;`
        const getMessageListResult = await db.query(getMessageList, [req.id, req.id, req.id]);
        
        if (getMessageListResult[0].length === 0) {
            return res.status(400).json({ error: '尚未與任何人進行對話' });
        };

        let messageList = getMessageListResult[0].map(entry => ({ friend_id:entry.id, room_id: entry.room, name: entry.name, friendEmail: entry.email, icon: entry.icon, status: entry.status, finalMessage: entry.message, finalMessageTime: entry.time}));
        return res.status(200).json({ messageList });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

router.get('/api/friendStatus', authToken, async (req, res) => {
    try {
        const getFriendRequests = 
        `SELECT users.email, users.name, users.icon
        FROM friend_requests
        JOIN users ON friend_requests.sender_id = users.id
        WHERE friend_requests.receiver_id = ? AND friend_requests.status = "待確認";`;
        const getFriendResult = await db.query(getFriendRequests, [req.id]);

        if (getFriendResult[0].length === 0) {
            return res.status(400).json({ error: '無好友申請' });
        };

        let friendEmails = getFriendResult[0].map(entry => ({email: entry.email, name: entry.name, icon: entry.icon}));
        return res.status(200).json({ friendEmails });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

router.post('/api/getHistoryMessage', authToken, async (req, res) => {
    let { roomId } = req.body;

    try {
        const getHistory = 
        `SELECT m.sender_id, m.receiver_id, m.message, m.time, u.icon
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.room = ?`;
        const getHistoryResult = await db.query(getHistory, [roomId]);

        if (getHistoryResult[0].length === 0) {
            return res.status(400).json({ error: '無歷史對話紀錄' });
        };

        let HistoryData = getHistoryResult[0].map(entry => ({ sender_id: entry.sender_id, receiver_id: entry.receiver_id, message: entry.message, time: entry.time, icon: entry.icon }));
        return res.status(200).json({ HistoryData });
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