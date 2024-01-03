const express = require('express');
const router = express.Router();
const path = require('path');

// 處理各路徑畫面
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/signup.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/chat.html'));
});

module.exports = router;