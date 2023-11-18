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
const iconMessagesList = document.querySelector('.icon_messagesList');
const iconFriendList = document.querySelector('.icon_friendList');
const iconAddFriend = document.querySelector('.icon_addFriend');

iconMessagesList.addEventListener('click', () => {
    MessagesList.style.display = 'block';
    AddFriend.style.display = 'none';    
    FriendList.style.display = 'none';    
});
iconFriendList.addEventListener('click', () => {
    FriendList.style.display = 'block'; 
    MessagesList.style.display = 'none';
    AddFriend.style.display = 'none';

    showFriendList(token);
});
iconAddFriend.addEventListener('click', () => {
    AddFriend.style.display = 'block';  
    MessagesList.style.display = 'none';
    FriendList.style.display = 'none';

    // 清空搜尋好友提示
    addFriendResult.textContent = '';
    checkFriend(token);
});

// 送出好友申請
const AddFriendButton = document.querySelector('.addFriend-button');
let addFriendResult = document.querySelector('.addFriend-result');
let addFriendCheck = document.querySelector('.addFriend-check');
let friendListCheck = document.querySelector('.friendList-check');

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

        if (response.status === 200) {
            addFriendResult.textContent = data.message;
        } else {
            addFriendResult.textContent = data.error;
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 顯示待確認好友申請
async function checkFriend(token) {
    try {
        let response = await fetch('/api/friendStatus', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        let data = await response.json();
        let friendData = data.friendEmails;

        // 每次進入都先清空待確認好友名單
        addFriendCheck.innerHTML = '';

        if (response.status === 200) {
            friendData.forEach(email => {
                let friendList = document.createElement('div');
                friendList.className = 'addFriend-list';
            
                let friendEmail = document.createElement('div');
                friendEmail.textContent = email;
            
                let friendAgree = document.createElement('div');
                friendAgree.textContent = 'O';
                friendAgree.className = 'addFriend-status';
                friendAgree.addEventListener('click', () => {
                    friendAnswerApi(email, 'O');
                });
            
                let friendRefuse = document.createElement('div');
                friendRefuse.textContent = 'X';
                friendRefuse.className = 'addFriend-status';
                friendRefuse.addEventListener('click', () => {
                    friendAnswerApi(email, 'X');
                });
            
                friendList.appendChild(friendEmail);
                friendList.appendChild(friendAgree);
                friendList.appendChild(friendRefuse);
                addFriendCheck.appendChild(friendList);
            });
        } else {
            console.error('錯誤：', data.error); // 無好友的情況不用特別顯示在頁面上
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 處理好友申請（接受或拒絕）
async function friendAnswerApi(email, status) {
    try {
        let response = await fetch('/api/addFriend', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, status }),
        });

        let data = await response.json();
        console.log(data);

        if (response.status === 200) {
            // 將對應的好友申請從頁面上清除
            let friendListItems = document.querySelectorAll('.addFriend-list div');

            friendListItems.forEach(item => {
                if (item.textContent.includes(email)) {
                    item.parentNode.remove();
                };
            });
        } else {
            console.error(data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 顯示好友列表
async function showFriendList(token) {
    try {
        let response = await fetch('/api/showFriendList', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        let data = await response.json();
        let friendData = data.friendEmails;

        // 每次進入都先清空好友名單
        friendListCheck.innerHTML = '';

        if (response.status === 200) {
            friendData.forEach(email => {
                let friendList = document.createElement('div');
                friendList.className = 'addFriend-list';
            
                let friendEmail = document.createElement('div');
                friendEmail.textContent = email;
            
                friendList.appendChild(friendEmail);
                friendListCheck.appendChild(friendList);
            });
        } else {
            console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};