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

// 進入頁面當下判斷是否有登入
const token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.display = 'none';
    checkUsers(token);
});

async function checkUsers(token) {
    try {
        let response = await fetch('/api/login', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        if (response.status === 200) {
            document.body.style.display = 'block';         
        } else if (response.status === 400) {
            window.location.href = '/';
            console.error('未登入帳號');
        } else {
            window.location.href = '/';
            console.error('伺服器內部錯誤');
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 處理登出
const logout = document.querySelector('.header-nav_logout');

logout.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.reload();
});

// 設置上方左側清單
const MessagesList = document.querySelector('.chat-messagesList');
const FriendList = document.querySelector('.chat-friendList');
const AddFriend = document.querySelector('.chat-addFriend');

// 設置下方按鈕
const iconAddFriend = document.querySelector('.icon_addFriend');

iconAddFriend.addEventListener('click', () => {
    MessagesList.style.display = 'none';
    AddFriend.style.display = 'block';    
});

// 添加好友邏輯（11/16）
const AddFriendButton = document.querySelector('.addFriend-button');

AddFriendButton.addEventListener('click', () => {
    addFriend(token);
});

async function addFriend(token) {
    let friendInput = document.querySelector('.friend_input');
    let friendEmail = friendInput.value;

    try {
        let response = await fetch('/api/addFriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ friendEmail }),
        });

        const data = await response.json();
        let addFriendResult = document.querySelector('.addFriend-result');

        if (response.status === 200) {
            addFriendResult.textContent = data.message;
        } else {
            addFriendResult.textContent = data.error;
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};