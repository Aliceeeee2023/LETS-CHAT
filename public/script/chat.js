// 建立與 Socket.IO 的連線
// io() 中寫的是 Socket.IO 連線的伺服器端點
const socket = io();

// 取得網頁資料
// const input = document.querySelector('.chat-input');
// const button = document.querySelector('.chat-button');
const chatMessagesContent = document.querySelector('.chat-messages_content');
const ul = document.querySelector('.ul');

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

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.display = 'none';
    checkUsers(token);
    showFriendList(token);
});

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

        if (response.status === 200) {
            currentUserId = data.userId;
            chatHeaderUser.textContent = data.email;
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

    getMessageList(token);
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
    chatHeaderPartner.textContent = email;

    // 動態生成聊天輸入框和發送按鈕
    const chatInputContainer = document.querySelector('.chat-input_container');    
    chatInputContainer.innerHTML = '';

    const chatInputDiv = document.createElement('div');
    chatInputDiv.className = 'chat-footer_input';
    
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
// function createMessageList(friend_id, room_id, friendEmail, finalMessage, finalMessageTime) {
//     const formattedDateTime = formatDateTime(finalMessageTime);

//     let messageList = document.createElement('div');
//     messageList.className = 'showMessageList';

//     let messageFriendEmail = document.createElement('div');
//     messageFriendEmail.textContent = friendEmail;
//     // messageFriendEmail.className = 'showMessageList';

//     let messageFriendFinal =  document.createElement('div');
//     messageFriendFinal.textContent = finalMessage +formattedDateTime;
//     messageFriendFinal.style.lineHeight = '20px'; 
//     // messageFriendFinal.className = 'showMessageList';    

//     messageList.addEventListener('click', () => {
//         // 取得歷史訊息
//         getHistoryMessage(token, room_id)
//         // 將好友加入 Socket.io room（測試中）
//         socket.emit('join room', { room: room_id });
//         currentRoomId = room_id;
//         currentFriendId = friend_id;

//         ul.innerHTML= '';
//         showTalkPage(friendEmail, room_id, friend_id);
//     });

//     messageList.appendChild(messageFriendEmail);
//     messageList.appendChild(messageFriendFinal);
//     messageListCheck.appendChild(messageList);
// }
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