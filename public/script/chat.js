

// 取得網頁資料
// const input = document.querySelector('.chat-input');
// const button = document.querySelector('.chat-button');
const chatMessagesContent = document.querySelector('.chat-messages_content');
const ul = document.querySelector('.ul');

const chatInputContainer = document.querySelector('.chat-input_container');  
// 確認按鈕是否有提交（感覺要改成 AJAX）
// button.addEventListener('click', e => {
//     // 取消默認動作，防止按鈕點擊導致刷新頁面
//     e.preventDefault();

//     // 如果輸入框有內容則觸發 chat message 事件，並且填入輸入框的內容
//     if(input.value) {
//         socket.emit('chat message', input.value);
//         input.value = ''; // 最後清空輸入框
//     };
// });

// 監聽 chat message 事件（事件名稱自己取），所以可以同時監聽很多個事件
// socket.on('chat message', msg => {
//     const li = document.createElement('li');
//     li.textContent = msg;

//     ul.appendChild(li);
// });

// 聊天視窗測試（待確認）
// Assume you already have the initialization code for Socket.IO
// const socket = io('http://localhost:3000');

// // Handle form submission for sending messages
// document.getElementById('messageForm').addEventListener('submit', function(event) {
//   event.preventDefault();
//   const messageInput = document.getElementById('messageInput');
//   const messageContent = messageInput.value.trim();

//   if (messageContent !== '') {
//     // Send the message to the server
//     sendMessage(messageContent);
//     messageInput.value = ''; // Clear the input field
//   }
// });

// // Function to send a message
// function sendMessage(content) {
//   const data = {
//     sender_id: 'user1', // Replace with the actual sender ID or username
//     receiver_id: 'user2', // Replace with the actual receiver ID or username
//     content: content,
//   };
//   socket.emit('message', data);
// }

// // Function to display a message in the UI
// function displayMessage(message) {
//   const messageDisplay = document.getElementById('messageDisplay');
//   const messageElement = document.createElement('p');
//   messageElement.textContent = `${message.sender_id}: ${message.content}`;
//   messageDisplay.appendChild(messageElement);
// }

// // Listen for incoming messages
// socket.on('message', function(message) {
//   displayMessage(message);
// });

// // Assume you have a mechanism to handle friend selection and retrieve friend's ID
// const selectedFriendId = 'user2'; // Replace with the actual selected friend's ID

// // Join the room associated with the selected friend
// socket.emit('join', selectedFriendId);

// 目前登錄的會員ID
let currentUserId = null;

// 進入頁面當下判斷是否有登入
const token = localStorage.getItem('token');





// 建立與 Socket.IO 的連線
// io() 中寫的是 Socket.IO 連線的伺服器端點
const socket = io();

// 直接在连接时发送 currentUserId
// socket.emit('set-current-user', { currentUserId });

// document.addEventListener('DOMContentLoaded', () => {
//     document.body.style.display = 'none';
//     checkUsers(token);
//     showFriendList(token);
// });

// socket.on('connect', () => {
//     console.log(currentUserId);
//     socket.emit('set-current-user', { currentUserId });
// });

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.display = 'none';

    // 假設checkUsers返回一個Promise
    checkUsers(token).then(() => {
        // 一旦checkUsers完成，currentUserId應該已經被更新
        console.log(currentUserId);

        // 將currentUserId發送到伺服器
        socket.emit('set-current-user', { currentUserId });

        // 在這裡執行其他操作或初始化
        showFriendList(token);
    });
});

// document.addEventListener('DOMContentLoaded', () => {
//     document.body.style.display = 'none';
    
//     // 调用异步函数，确保在连接时 currentUserId 已经设置
//     setupSocketConnection();
    
//     showFriendList(token);
// });

// async function setupSocketConnection() {
//     // 假设 checkUsers 是一个异步函数，等待 currentUserId 的设置
//     console.log('Before checkUsers');
//     await checkUsers(token);
//     console.log(currentUserId);

//     // 在连接时发送 currentUserId
//     socket.on('connect', () => {
//         console.log(currentUserId);
//         socket.emit('set-current-user', { currentUserId });
//     });
// }

let myName;
let myEmail;


const chatHeaderUser = document.querySelector('.chat-header_user');

async function checkUsers(token) {
    try {
        let response = await fetch('/api/login', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });
        const data = await response.json();
        console.log(data);
        console.log(response.status);

        if (response.status === 200) {
            currentUserId = data.userId;
            myName = data.name;

            myEmail = data.email;
            console.log(currentUserId);
            chatHeaderUser.textContent = myName;
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
const iconSetting = document.querySelector('.icon_setting');

iconMessagesList.addEventListener('click', () => {
    MessagesList.style.display = 'block';
    AddFriend.style.display = 'none';    
    FriendList.style.display = 'none';    
    chatMessagesSetting.style.display = 'none';

    getMessageList(token);
});
iconFriendList.addEventListener('click', () => {
    FriendList.style.display = 'block'; 
    MessagesList.style.display = 'none';
    AddFriend.style.display = 'none';
    chatMessagesSetting.style.display = 'none';

    showFriendList(token);
});
iconAddFriend.addEventListener('click', () => {
    AddFriend.style.display = 'block';  
    MessagesList.style.display = 'none';
    FriendList.style.display = 'none';
    chatMessagesSetting.style.display = 'none';

    // 清空搜尋好友提示
    addFriendResult.textContent = '';
    checkFriend(token);
});

const emailContent = document.querySelector('.email-content');
const chatMessagesSetting  = document.querySelector('.chat-messages_setting ');

iconSetting.addEventListener('click', () => {
    chatHeaderPartner.innerHTML = '';
    callButton.style.display = 'none';
    AddFriend.style.display = 'none';  
    MessagesList.style.display = 'none';
    FriendList.style.display = 'none';
    chatMessagesSetting.style.display = 'block';
    chatHeaderPartner.textContent = '會員資料設定';
    ul.innerHTML = '';
    chatInputContainer.innerHTML = '';
    FriendList.style.display = 'block'; 
    MessagesList.style.display = 'none';
    AddFriend.style.display = 'none';

    nameContent.textContent = myName;
    emailContent.textContent = myEmail;

    showFriendList(token);
});


// 修改姓名＆EMAIL
const dataEmailChange = document.querySelector('.data-email_change');

dataEmailChange.addEventListener('click', function () {
    if (this.textContent === '修改') {
        // 切換到編輯模式
        emailContent.contentEditable = true;
        emailContent.focus();
        this.textContent = '完成';
    } else {
        // 完成編輯，將資料傳送到資料庫
        const newEmail = emailContent.textContent.trim();
        // 在這裡將 newEmail 送到資料庫進行更新
        // 這裡只是一個範例，實際上你需要使用適當的方法和工具來實現資料更新

        // 切換回非編輯模式
        emailContent.contentEditable = false;
        this.textContent = '修改';
    }
});

const nameContent = document.querySelector('.name-content');
const dataNameChange = document.querySelector('.data-name_change');

dataNameChange.addEventListener('click', function () {
    if (this.textContent === '修改') {
        // 切換到編輯模式
        nameContent.contentEditable = true;
        nameContent.focus();
        this.textContent = '完成';
    } else {
        // 完成編輯，將資料傳送到資料庫
        const newName = nameContent.textContent.trim();
        // 在這裡將 newName 送到資料庫進行更新
        // 這裡只是一個範例，實際上你需要使用適當的方法和工具來實現資料更新

        // 切換回非編輯模式
        nameContent.contentEditable = false;
        this.textContent = '修改';
    }
});


// 修改圖片
const profilePic = document.getElementById('profilePic');
const changeProfilePic = document.getElementById('changeProfilePic');
const fileInput = document.getElementById('fileInput');

changeProfilePic.addEventListener('click', function () {
    // 觸發檔案選擇
    fileInput.click();
});

fileInput.addEventListener('change', function () {
    const selectedFile = fileInput.files[0];

    if (selectedFile) {
        // 處理上傳圖片的邏輯，例如發送到後端

        // 在這裡，你需要使用適當的方式將選擇的圖片上傳到資料庫

        // 同時更新 setting-pic 的背景圖片
        const reader = new FileReader();
        reader.onload = function (e) {
            profilePic.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(selectedFile);
    }
});



// 送出好友申請
const AddFriendButton = document.querySelector('.addFriend-button');
let addFriendResult = document.querySelector('.addFriend-result');
let addFriendCheck = document.querySelector('.addFriend-check');
let messageListCheck = document.querySelector('.messagesList-check');
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
        friendInput.value = '';

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

let currentFriendId = null;

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
            friendData.forEach(({ friendId, email, roomId }) => {
                let friendList = document.createElement('div');
                friendList.className = 'showFriendList';
            
                let friendEmail = document.createElement('div');
                friendEmail.textContent = email;
                friendList.addEventListener('click', () => {
                    // 取得歷史訊息
                    getHistoryMessage(token, roomId)
                    // 將好友加入 Socket.io room（測試中）
                    socket.emit('join room', { room: roomId });
                    currentRoomId = roomId;
                    currentFriendId = friendId;

                    ul.innerHTML= '';
                    showTalkPage(email, roomId, friendId);
                });
            
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

// 確認當下點擊的ID
let currentRoomId = null;

// 點擊好友後渲染到聊天頁面（處理中）
const chatHeaderPartner = document.querySelector('.chat-header_partner');

function showTalkPage(email, roomId, friendId) {
    chatMessagesSetting.style.display = 'none';
    chatHeaderPartner.textContent = email;
    callButton.style.display = 'block';

    // 動態生成聊天輸入框和發送按鈕  
    chatInputContainer.innerHTML = '';

    const chatInputDiv = document.createElement('div');
    chatInputDiv.className = 'chat-footer_input';
    

    // 新增左邊容器用於放置上傳圖片按鈕
    const leftContainer = document.createElement('div');
    leftContainer.className = 'left-container';

    // 創建上傳圖片按鈕
    const uploadButton = document.createElement('div');
    uploadButton.className = 'upload-button';

    // 添加上傳圖片按鈕到左邊容器
    leftContainer.appendChild(uploadButton);

    // 將 chatInputDiv 添加到 chatFooter
    chatInputContainer.appendChild(leftContainer);
    chatInputContainer.appendChild(chatInputDiv);


    const chatInput = document.createElement('textarea');
    chatInput.type = 'text';
    chatInput.className = 'chat-input';
    chatInput.placeholder = 'Type your message';

    const sendButton = document.createElement('button');
    sendButton.className = 'chat-button';
    sendButton.textContent = 'Send';

    // 將輸入框和按鈕添加到 chatInputDiv
    chatInputDiv.appendChild(chatInput);

    // 將 chatInputDiv 添加到 chatFooter
    chatInputContainer.appendChild(chatInputDiv);
    chatInputContainer.appendChild(sendButton);

    sendButton.addEventListener('click', () => {
        const message = chatInput.value.trim(); // 取得輸入框的值，並去除頭尾空格
        if (message !== '') {
            // appendMessageToUI(email, message);

            // 將訊息傳送到後端
            socket.emit('chat message', { room: roomId, currentUserId, currentFriendId, message });
            // 清空輸入框
            chatInput.value = '';
        }
    });
};


// 取得歷史訊息
async function getHistoryMessage(token, roomId) {
    try {
        let response = await fetch('/api/getHistoryMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roomId }),
        });

        let data = await response.json();
        let history = data.HistoryData;

        if (response.status === 200) {
            history.forEach(({ sender_id, receiver_id, message, time }) => {
                createMessageElement(sender_id, receiver_id, message, time);
            });

        } else {
            console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 生成歷史訊息（確認中）
function createMessageElement(sender_id, receiver_id, message, time) {
    const messageContainer = document.createElement('div');
    const textMessage = document.createElement('div');
    textMessage.textContent = message;

    // 添加适当的样式和边框
    textMessage.style.border = '1px solid #aaaaaa';
    textMessage.style.borderRadius = '10px';
    textMessage.style.padding = '7px';
    messageContainer.style.marginBottom = '5px'; // 调整此处的 margin
    messageContainer.style.padding = '5px'; // 调整此处的 padding

    // 如果 currentUserId 等于 sender_id，则是自己的消息
    if (currentUserId === sender_id) {
        // 设置底色为淺綠色
        textMessage.style.backgroundColor = '#c1ecc1';
        // 设置文本右对齐
        textMessage.style.textAlign = 'right';
        // 将消息容器放在右边
        messageContainer.style.marginLeft = 'auto';
        messageContainer.style.textAlign = 'right';
    } else {
        // 设置底色为灰色
        textMessage.style.backgroundColor = '#d9d9d9';
        // 设置文本左对齐
        textMessage.style.textAlign = 'left';
        // 将消息容器放在左边
        messageContainer.style.marginRight = 'auto';
        messageContainer.style.textAlign = 'left';
    }

    // 使边框包裹文字
    textMessage.style.display = 'inline-block';

    // 将文本消息添加到消息容器
    messageContainer.appendChild(textMessage);
    ul.appendChild(messageContainer);

    // 滚动到底部
    ul.scrollTop = ul.scrollHeight;
}


// 顯示聊天列表（處理中）
async function getMessageList(token) {
    try {
        let response = await fetch('/api/getMessageList', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        let data = await response.json();
        let messageList = data.messageList;

        if (response.status === 200) {
            messageListCheck.innerHTML= '';

            messageList.forEach(({ friend_id, room_id, friendEmail, finalMessage, finalMessageTime }) => {
                createMessageList(friend_id, room_id, friendEmail, finalMessage, finalMessageTime);
            });

        } else {
            console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 建立聊天列表（確認中）
function createMessageList(friend_id, room_id, friendEmail, finalMessage, finalMessageTime) {
    const formattedDateTime = formatDateTime(finalMessageTime);

    let messageList = document.createElement('div');
    messageList.className = 'showMessageList';

    let messageContainer = document.createElement('div');
    messageContainer.style.display = 'flex';
    messageContainer.style.flexDirection = 'column';  // 列布局

    let messageFriendEmail = document.createElement('div');
    messageFriendEmail.textContent = friendEmail;
    messageFriendEmail.style.fontSize = '16px';  // 设置字体大小，根据需要调整

    let messageContentContainer = document.createElement('div');
    messageContentContainer.style.display = 'flex';
    messageContentContainer.style.alignItems = 'baseline';  // 使两个元素基线对齐

    let messageFriendFinal = document.createElement('div');
    messageFriendFinal.textContent = finalMessage;
    messageFriendFinal.style.fontSize = '14px';  // 设置字体大小，根据需要调整

    let messageTime = document.createElement('div');
    messageTime.textContent = formattedDateTime;
    messageTime.style.fontSize = '14px';  // 设置字体大小，根据需要调整
    messageTime.style.marginLeft = 'auto';  // 推到最右邊

    messageContentContainer.appendChild(messageFriendFinal);
    messageContentContainer.appendChild(messageTime);

    messageContainer.appendChild(messageFriendEmail);
    messageContainer.appendChild(messageContentContainer);

    messageList.addEventListener('click', () => {
        // 取得歷史訊息
        getHistoryMessage(token, room_id)
        // 將好友加入 Socket.io room（測試中）
        socket.emit('join room', { room: room_id });
        currentRoomId = room_id;
        currentFriendId = friend_id;

        ul.innerHTML= '';
        showTalkPage(friendEmail, room_id, friend_id);
    });

    messageList.appendChild(messageContainer);
    messageListCheck.appendChild(messageList);
}

// 處理時間
function formatDateTime(isoString) {
    const date = new Date(isoString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = (date.getHours()).toString().padStart(2, '0');  // 加 8 小時
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month}-${day} ${hours}:${minutes}`;
}

function appendMessageToUI(message, sendUserId) {
    // const messageContainer = document.createElement('div');
    // const textMessage = document.createElement('div');
    // textMessage.textContent = `${message}`;

    // if (currentUserId == sendUserId) {
    //     textMessage.style.textAlign = 'right';
    //     messageContainer.style.marginLeft = 'auto';
    //     textMessage.style.backgroundColor = '#c1ecc1';
    // } else {
    //     textMessage.style.backgroundColor = '#d9d9d9';
    // }

    // textMessage.style.display = 'inline-block';
    // textMessage.style.border = '1px solid #aaaaaa';

    // messageContainer.appendChild(textMessage);
    // ul.appendChild(textMessage);
    const messageContainer = document.createElement('div');
    const textMessage = document.createElement('div');
    textMessage.textContent = message;

    // 添加适当的样式和边框
    textMessage.style.border = '1px solid #aaaaaa';
    textMessage.style.borderRadius = '10px';
    textMessage.style.borderRadius = '10px';
    textMessage.style.padding = '7px';
    messageContainer.style.marginBottom = '5px'; // 调整此处的 margin
    messageContainer.style.padding = '5px'; // 调整此处的 padding

    // 如果 currentUserId 等于 sendUserId，则是自己的消息
    if (currentUserId === sendUserId) {
        // 设置底色为淺綠色
        textMessage.style.backgroundColor = '#c1ecc1';
        // 设置文本右对齐
        textMessage.style.textAlign = 'right';
        // 将消息容器放在右边
        messageContainer.style.marginLeft = 'auto';
        messageContainer.style.textAlign = 'right';
    } else {
        // 设置底色为灰色
        textMessage.style.backgroundColor = '#d9d9d9';
        // 设置文本左对齐
        textMessage.style.textAlign = 'left';
        // 将消息容器放在左边
        messageContainer.style.marginRight = 'auto';
        messageContainer.style.textAlign = 'left';
    }

    // 使边框包裹文字
    textMessage.style.display = 'inline-block';

    // 将文本消息添加到消息容器
    messageContainer.appendChild(textMessage);

    // 将消息容器添加到聊天窗口
    ul.appendChild(messageContainer);
}

socket.on('chat message', (data) => {
    const { room, message, currentUserId } = data;
    
    // 在前端顯示消息
    if (room === currentRoomId) {
        appendMessageToUI(message, currentUserId);
    }
});

// // 本次新增
// socket.on('friend stream', (friendStream) => {
//     const friendAudio = document.getElementById('friendAudio');
  
//     const audioContext = new AudioContext();
//     const source = audioContext.createMediaStreamSource(friendStream);
  
//     source.connect(audioContext.destination);
  
//     friendAudio.srcObject = friendStream;
//     friendAudio.play().catch((error) => {
//       console.error('播放音訊時發生錯誤：', error);
//     });
//   });


// 語音新增
// 初始化 Peer.js（早就不需要金鑰==）
// const peer = new Peer();

// undefined 表示使用默认生成的 Peer ID，由 Peer.js 自动生成。
// host: '/' 表示将连接的主机设置为当前主机。
// port: 3000 表示将连接的端口设置为 3000。
// path: '/peerjs' 表示将连接的路径设置为 '/peerjs'。
// const peer = new Peer(undefined, {
//     host: '/',
//     port: 3000,
//     path: '/peerjs',
// });

// 聲明一個可變的變數 call，它將用於存儲正在進行的通話
// 將通話對象賦值給這個變數，以便以後進行控制（例如結束通話）
// let call; // 初始值為 undefined 的變數

// 監聽 Peer.js 連接成功的事件
// 這裡的 ID 是我自己的 ID
// peer.on('open', (id) => {
//     console.log('My peer ID is: ' + id);

//     // 點擊開始通話按鈕的事件處理
//     document.getElementById('startCallButton').addEventListener('click', () => {
//         // 發送 'call friend' 事件給後端，通知後端要發起通話
//         const friendPeerId = prompt('請輸入朋友的 Peer ID：');
//         call = peer.call(friendPeerId, null);

//         call.on('stream', (friendStream) => {
//             // 將朋友的音頻流設置為 <audio> 元素的 srcObject
//             document.getElementById('friendAudio').srcObject = friendStream;
//         });

//         // 切換按鈕顯示
//         document.getElementById('startCallButton').style.display = 'none';
//         document.getElementById('endCallButton').style.display = 'inline';
//     });

//     // 點擊結束通話按鈕的事件處理
//     document.getElementById('endCallButton').addEventListener('click', () => {
//         // 結束通話
//         if (call) {
//             call.close();
//         }

//         // 切換按鈕顯示
//         document.getElementById('startCallButton').style.display = 'inline';
//         document.getElementById('endCallButton').style.display = 'none';
//     });
// });

// // 監聽來自 Socket.IO 的 'friend stream' 事件
// socket.on('friend stream', (friendStream) => {
//     // 將朋友的音頻流設置為 <audio> 元素的 srcObject
//     document.getElementById('friendAudio').srcObject = friendStream;
// });




// 統整的版本
const callButton = document.getElementById('callButton');
const callRequestModal = document.getElementById('callRequestModal');
const cancelCallButton = document.getElementById('cancelCallButton');
const callResponseModal = document.getElementById('callResponseModal');
const acceptCallButton = document.getElementById('acceptCallButton');
const rejectCallButton = document.getElementById('rejectCallButton');
const callInProgressModal = document.getElementById('callInProgressModal');
const hangupButton = document.getElementById('hangupButton');
const localAudio = document.getElementById('localAudio');
const remoteAudio = document.getElementById('remoteAudio');

// 說 peer 要存成全局變數
const peer = new Peer();
let currentCall;

// 監聽 'open' 事件，當 Peer 建立成功時觸發（主要是拿peer id）（還不知道有甚麼用）
peer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
});

// 使用 Peer.js 进行 WebRTC 连接

callButton.addEventListener('click', async () => {
    try {
        // 发送通话请求事件给朋友
        socket.emit('call-request', { currentUserId, currentFriendId });
        

        // 显示等待对方接听的模态框
        showCallRequestModal();

    } catch (error) {
        console.error('Error fetching friend ID:', error);
    }
});


// 定義一個全局變數，用於存儲 callerId
let currentCallerId;

// 添加事件監聽器，處理通話請求
socket.on('incoming-call', ({ callerId }) => {
    currentCallerId = callerId;

    // 顯示來自 callerId 的通話請求模態框
    console.log(currentUserId);
    showCallResponseModal(callerId);
    // showCallResponseModal(callerId);
});

// peer 有可能也要送全局（id問題）
// const peer = new Peer();

// 在全局定義一個變數來存儲 acceptId
let callRequestId;
let callAcceptId;

// 設置接受和拒絕通話的按鈕監聽器
acceptCallButton.addEventListener('click', async () => {
    try {

        socket.emit('accept-call', { acceptId: currentUserId , callerId: currentCallerId});

        // 關閉通話邀請模態框
        closeCallResponseModal();

    } catch (error) {
        console.error('Error accepting call:', error);
    }
});

// 監聽 'start-webrtc-connection' 事件
socket.on('start-webrtc-connection', (data) => {
    console.log('觸發');

    // 關閉等待對方接受的畫面
    closeCallRequestModal();
    // 先顯示正在通話的畫面
    showCallInProgressModal();

    const { initiatorId, acceptId } = data;
    // 將 acceptId 賦值給全局變數
    callRequestId = initiatorId;
    callAcceptId = acceptId;

    // 在這裡觸發 WebRTC 連線的建立流程
    // 使用 initiatorId 和 acceptId 這兩個標識符

    // 假設你已經有 localAudio 和 remoteAudio 元素用於顯示音訊
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            // 將本地音頻流設置到本地音頻元素
            localAudio.srcObject = stream;

            // 建立 Peer 對象
            const call = peer.call(acceptId, stream);

            // 監聽 'stream' 事件
            call.on('stream', (remoteStream) => {
                // 在這裡處理遠程音頻流，例如將其設置到 remoteAudio 元素
                remoteAudio.srcObject = remoteStream;
            });
        })
        .catch((error) => {
            console.error('Error accessing local audio:', error);
        });

});

// 點擊挂断通话
hangupButton.addEventListener('click', () => {
    // 向後端發送通知
    console.log('hihihi')
    socket.emit('hangup-call', { callRequestId }); // 可以傳遞接受方的 ID，以便後端知道是哪一方發送的掛斷通話通知

    endcall();
});

// 讓另一方也掛斷通話
socket.on('hangup-other-call', () => {
    endcall();
});

// 掛斷電話處理
function endcall() {
    // 隱藏通話畫面
    closeCallInProgressModal();

    console.log('hi');
    // 關閉本地音訊流
    const localStream = localAudio.srcObject;
    const tracks = localStream.getTracks();
    tracks.forEach(track => track.stop());

    // 關閉遠程音訊流
    const remoteStream = remoteAudio.srcObject;
    const remoteTracks = remoteStream.getTracks();
    remoteTracks.forEach(track => track.stop());

    // 結束通話對象
    if (currentCall) {
        currentCall.close();
        // currentCall = null;
    }
}

// 點選取消按鈕
cancelCallButton.addEventListener('click', () => {
    closeCallRequestModal();

    // 取消對方的畫面顯示
    socket.emit('cancel-call', { currentFriendId }); 
});

socket.on('cancel-other-call', () => {
    closeCallResponseModal();
});

// 點選拒絕按鈕
rejectCallButton.addEventListener('click', () => {
    // 關閉通話邀請模態框
    closeCallResponseModal();

    // 發送拒絕通話的事件，告知後端
    socket.emit('reject-call', { currentCallerId });
});

socket.on('reject-other-call', () => {
    closeCallRequestModal();
});

// 各種匡匡處理
function showCallRequestModal(currentUserId) { // 要把ID塞入框李
    callRequestModal.style.display = 'block';
}
function closeCallRequestModal() {
    callRequestModal.style.display = 'none';
}

const comingCallName = document.querySelector('.comingCallName');

function showCallResponseModal(callerId) {
    callResponseModal.style.display = 'block';
    comingCallName.textContent = callerId + '來電';
    // 要顯示來電名稱（後面要改）
}
function closeCallResponseModal() {
    callResponseModal.style.display = 'none';
}
function showCallInProgressModal() {
    callInProgressModal.style.display = 'block';
}
function closeCallInProgressModal() {
    callInProgressModal.style.display = 'none';
}