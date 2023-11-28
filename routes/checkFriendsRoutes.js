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
        SELECT DISTINCT users.id AS friendId, users.email, fr.id
        FROM friend_requests AS fr
        JOIN users ON (LEAST(fr.sender_id, fr.receiver_id) = users.id OR GREATEST(fr.sender_id, fr.receiver_id) = users.id)
        WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = "已確認" AND users.email != ?;`;
        const getFriendResult = await db.query(getFriendRequests, [req.id, req.id, req.email]);

        // 如果無資料表示未有好友
        if (getFriendResult[0].length === 0) {
            return res.status(400).json({ error: '無好友申請' });
        };

        // 回傳好友明細
        let friendEmails = getFriendResult[0].map(entry => ({ friendId: entry.friendId, email: entry.email, roomId: entry.id }));
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

// 產生房間號------------
// router.get('/api/friendRoom', authToken, async (req, res) => {
//     try {
//         // 排除申請＆接收重複的情況，且排除取到自己的 Email
//         const getFriendRequests = `
//         SELECT DISTINCT users.email
//         FROM friend_requests AS fr
//         JOIN users ON (LEAST(fr.sender_id, fr.receiver_id) = users.id OR GREATEST(fr.sender_id, fr.receiver_id) = users.id)
//         WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = "已確認" AND users.email != ?;`;
//         const getFriendResult = await db.query(getFriendRequests, [req.id, req.id, req.email]);

//         // 如果無資料表示未有好友
//         if (getFriendResult[0].length === 0) {
//             return res.status(400).json({ error: '無好友申請' });
//         };

//         // 回傳好友明細
//         let friendEmails = getFriendResult[0].map(entry => entry.email);
//         return res.status(200).json({ friendEmails });
//     } catch (error) {
//         console.error('錯誤：', error);
//         return res.status(500).json({ error: '伺服器內部錯誤' });
//     };
// });

// 取得對話中的歷史訊息
router.post('/api/getHistoryMessage', authToken, async (req, res) => {
    let { roomId } = req.body;

    try {
        // 排除申請＆接收重複的情況，且排除取到自己的 Email
        const getHistory = 
        `SELECT sender_id, receiver_id, message, time FROM messages
        WHERE room = ?`;
        const getHistoryResult = await db.query(getHistory, [roomId]);

        // 如果無資料表示未有紀錄
        if (getHistoryResult[0].length === 0) {
            return res.status(400).json({ error: '無歷史對話紀錄' });
        };

        let HistoryData = getHistoryResult[0].map(entry => ({ sender_id: entry.sender_id, receiver_id: entry.receiver_id, message: entry.message, time: entry.time }));
        return res.status(200).json({ HistoryData });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

// 取得聊天列表
router.post('/api/getMessageList', authToken, async (req, res) => {
    try {
        // 排除申請＆接收重複的情況，且排除取到自己的 Email
        // const getMessageList = 
        // `SELECT DISTINCT u.id, u.email, m.room
        // FROM messages m
        // JOIN users u ON m.receiver_id = u.id
        // WHERE m.sender_id = ?
        // OR (m.receiver_id = ? AND m.sender_id = u.id);`;

        const getMessageList = 
        `WITH RankedMessages AS (
            SELECT
                u.id,
                u.email,
                m.room,
                m.message,
                m.time,
                ROW_NUMBER() OVER (PARTITION BY u.email ORDER BY m.time DESC) AS rnk
            FROM messages m
            JOIN users u ON m.receiver_id = u.id
            WHERE m.sender_id = ? OR (m.receiver_id = ? AND m.sender_id = u.id)
        )
        SELECT id, email, room, message, time
        FROM RankedMessages
        WHERE rnk = 1;`;
        const getMessageListResult = await db.query(getMessageList, [req.id, req.id]);

        // 如果無資料表示聊天過的會員
        if (getMessageListResult[0].length === 0) {
            return res.status(400).json({ error: '尚未與任何人進行對話' });
        };

        let messageList = getMessageListResult[0].map(entry => ({ friend_id:entry.id, room_id: entry.room, friendEmail: entry.email, finalMessage: entry.message, finalMessageTime: entry.time}));
        return res.status(200).json({ messageList });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

module.exports = router;