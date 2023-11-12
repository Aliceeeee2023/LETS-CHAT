const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// 導出模組方便 app.js 使用
module.exports = router;