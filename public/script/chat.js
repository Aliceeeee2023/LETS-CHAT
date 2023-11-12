// 建立與 Socket.IO 的連線
// io() 中寫的是 Socket.IO 連線的伺服器端點
const socket = io('http://localhost:3000');

// 取得網頁資料
const input = document.querySelector('.chat-input');
const button = document.querySelector('.chat-button');
const ul = document.querySelector('.ul');

// 確認按鈕是否有提交（感覺要改成 AJAX）
button.addEventListener('click', e => {
    // 取消默認動作，防止按鈕點擊導致刷新頁面
    e.preventDefault();

    // 如果輸入框有內容則觸發 chat message 事件，並且填入輸入框的內容
    if(input.value) {
        socket.emit('chat message', input.value);
        input.value = ''; // 最後清空輸入框
    };
});

// 監聽 chat message 事件（事件名稱自己取），所以可以同時監聽很多個事件
socket.on('chat message', msg => {
    const li = document.createElement('li');
    li.textContent = msg;

    ul.appendChild(li);
});