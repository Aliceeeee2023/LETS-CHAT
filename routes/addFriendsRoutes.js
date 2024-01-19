const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../modules/database.js');
const jwt = require('jsonwebtoken');
const path = require('path');

const limiter = rateLimit({
    windowMs: 1000,
    max: 1,
    message: { error: '請避免短時間內多次操作' },
});

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const s3BucketName = process.env.AWS_S3_BUCKET_NAME;
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

function checkNickname(name) {
    const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z]{2,10}$/;
    return nicknameRegex.test(name);
}

router.post('/api/addFriend', authToken, async (req, res) => {
    let { friendEmail } = req.body;

    if (req.email === friendEmail) {
        return res.status(400).json({ error: '請勿輸入自己的帳號' });
    };

    try {
        const findFriendQuery = 
        `SELECT u.id AS friendId, fr.status AS friendRequestStatus
        FROM users u
        LEFT JOIN friend_requests fr ON (fr.receiver_id = u.id AND fr.sender_id = ?) OR (fr.sender_id = u.id AND fr.receiver_id = ?)
        WHERE u.email = ?;`;
        const checkFriendResults = await db.query(findFriendQuery, [req.id, req.id, friendEmail]);

        if (checkFriendResults[0].length === 0) {
            return res.status(400).json({ error: '查詢不到此帳號' });
        };

        const friendId = checkFriendResults[0]['0'].friendId;
        const friendRequestStatus = checkFriendResults[0]['0'].friendRequestStatus;

        if (friendRequestStatus === '待確認') {
            return res.status(400).json({ error: '等待對方回覆' });
        } else if (friendRequestStatus === '已拒絕') {
            return res.status(400).json({ error: '等待對方回覆' });
        } else if (friendRequestStatus === '已確認') {
            return res.status(400).json({ error: '雙方已為好友' });
        };

        const addFriendQuery = 'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)';
        const addFriendResults = await db.query(addFriendQuery, [req.id, friendId, '待確認']);

        return res.status(200).json({ message: '已送出好友申請' });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

router.put('/api/addFriend', authToken, async (req, res) => {
    let { email, status } = req.body;

    try {
        let updateFriendStatus = 
        `UPDATE friend_requests fr
        JOIN users u ON fr.sender_id = u.id AND fr.receiver_id = ?
        SET fr.status = ?
        WHERE u.email = ?`;

        if (status === 'O') {
            const updateFriendResults = await db.query(updateFriendStatus, [req.id, '已確認', email]);
            return res.status(200).json({ message: '好友申請已確認' });
        } else if (status === 'X') {
            const updateFriendResults = await db.query(updateFriendStatus, [req.id, '已拒絕', email]);
            return res.status(200).json({ message: '好友申請已拒絕' });
        };
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    }
});

router.post('/api/changeName', authToken, async (req, res) => {
    let { newName } = req.body;

    if (!checkNickname(newName)) {
        return res.status(400).json({ error: '請勿輸入錯誤暱稱格式' });
    };

    try {  
        const changeNameQuery = 
        `UPDATE users
        SET name = ?
        WHERE id = ?;`;
        const checkFriendResults = await db.query(changeNameQuery, [newName, req.id]);

        return res.status(200).json({ message: '已修改完成' });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

router.post('/api/changeStatus', authToken, async (req, res) => {
    let { newStatus } = req.body;

    if (newStatus === "") {
        newStatus = null;
    };

    try {  
        const changeStatusQuery = 
        `UPDATE users
        SET status = ?
        WHERE id = ?;`;
        const checkFriendResults = await db.query(changeStatusQuery, [newStatus, req.id]);

        return res.status(200).json({ message: '已修改完成' });
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

router.post('/api/changeMemberIcon', upload.single('file'),  authToken, async (req, res) => {
    const file = req.file;
    const key = 'uploads/' + Date.now() + '-' + file.originalname;
  
    if (!file) {
        return res.status(400).json({ error: '無選擇圖片上傳' });
    }

    const params = {
        Bucket: s3BucketName,
        Key: 'uploads/' + Date.now() + '-' + file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
  
    s3.upload(params, async (err, data) => {
        if (err) {
            return res.status(400).json({ error: '上傳失敗' });
        }

        try {
            const fileURL = 'https://d5ygihl98da69.cloudfront.net/uploads/' + path.basename(data.Location);
            const changeIconQuery = 'UPDATE users SET icon = ? WHERE id = ?';
            const changeIconResult = await db.query(changeIconQuery, [fileURL, req.id]);

            return res.status(200).json({ message: fileURL });
        } catch (error) {
            console.error('錯誤：', error);
            return res.status(500).json({ error: '資料庫錯誤' });
        }
    });
});

router.post('/api/addFile', upload.single('file'),  authToken, async (req, res) => {
    const file = req.file;
    const roomID = req.body.roomID;
    const senderID = req.body.senderID;
    const receiverId = req.body.receiverID;   
    const key = 'uploads/' + Date.now() + '-' + file.originalname;
  
    if (!file) {
        return res.status(404).json({ error: '無選擇圖片上傳' });
    }

    const params = {
        Bucket: s3BucketName,
        Key: 'uploads/' + Date.now() + '-' + file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
  
    s3.upload(params, async (err, data) => {
        if (err) {
            return res.status(400).json({ error: '上傳失敗' });
        }

        try {
            const fileURL = 'https://d5ygihl98da69.cloudfront.net/uploads/' + path.basename(data.Location);
            const changeIconQuery = 'INSERT INTO messages (room, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)';
            const changeIconResult = await db.query(changeIconQuery, [roomID, senderID, receiverId, fileURL]);

            return res.status(200).json({ message: fileURL });
        } catch (error) {
            console.error('錯誤：', error);
            return res.status(500).json({ error: '資料庫錯誤' });
        }
    });
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