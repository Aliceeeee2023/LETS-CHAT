const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../modules/database.js');

const limiter = rateLimit({
    windowMs: 1000,
    max: 1,
    message: { error: '請避免短時間內多次操作' },
});

function checkEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
function checkPassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
    return passwordRegex.test(password);
};

function checkNickname(name) {
    const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z]+$/;
    return nicknameRegex.test(name);
}

router.post('/api/signup', limiter, async (req, res) => {
    const { email, name, password } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: '註冊資料不可為空' });
    } else if (!checkEmail(email)) {
        return res.status(400).json({ error: '無效的電子郵件格式' });
    } else if (!checkNickname(name)) {
        return res.status(400).json({ error: '無效的暱稱格式' });
    } else if (!checkPassword(password)) {
        return res.status(400).json({ error: '無效的密碼格式' });
    };

    try {
        const checkEmailExist = 'SELECT * FROM users WHERE email = ?';
        const emailExistResults = await db.query(checkEmailExist, [email]);
        const defaultIcon = 'https://d5ygihl98da69.cloudfront.net/uploads/screenshot_20231207_025708.png'

        if (emailExistResults[0].length > 0) {
            return res.status(400).json({ error: '電子郵件地址已存在' });
        } else {
            const insertUser = 'INSERT INTO users (email, name, password, icon) VALUES (?, ?, ?, ?)';
            await db.query(insertUser, [email, name, password, defaultIcon]);

            return res.status(200).json({ ok: true });
        };
    } catch (error) {
        console.error('錯誤：', error);
        return res.status(500).json({ error: '伺服器內部錯誤' });
    };
});

module.exports = router;