const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('./database.js');

// 限制每秒最多一個請求
const limiter = rateLimit({
    windowMs: 1000,
    max: 1,
    message: { error: '請避免短時間內多次操作' },
});

module.exports = router;