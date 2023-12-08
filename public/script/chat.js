

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
let myIcon;

const chatHeaderUser = document.querySelector('.chat-header_user');
const chatHeaderIcon = document.querySelector('.chat-header_icon');
const chatHeaderName = document.querySelector('.chat-header_name');

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
            myIcon = data.icon;
            myEmail = data.email;
            console.log(currentUserId);
            chatHeaderName.textContent = myName;

            // 生出ICON
            //                 let friendIcon = document.createElement('div');
            //     friendIcon.className = 'showFriendIcon';
            //     friendIcon.style.backgroundImage = `url(${icon})`;
            
            chatHeaderIcon.style.backgroundImage = `url(${myIcon})`;
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
const chatIndex = document.querySelector('.chat-index');


iconMessagesList.addEventListener('click', () => {
    MessagesList.style.display = 'block';
    AddFriend.style.display = 'none';    
    FriendList.style.display = 'none';   
    chatMessagesSetting.style.display = 'none';
    chatIndex.style.display = 'flex';
    ul.innerHTML = ''

    getMessageList(token);
});
iconFriendList.addEventListener('click', () => {
    FriendList.style.display = 'block'; 
    MessagesList.style.display = 'none';
    AddFriend.style.display = 'none';
    chatMessagesSetting.style.display = 'none';
    chatIndex.style.display = 'flex';
    ul.innerHTML = ''

    showFriendList(token);
});
iconAddFriend.addEventListener('click', () => {
    AddFriend.style.display = 'block';  
    MessagesList.style.display = 'none';
    chatIndex.style.display = 'flex';
    FriendList.style.display = 'none';
    chatMessagesSetting.style.display = 'none';
    ul.innerHTML = ''
    addFriendResult.style.marginBottom = '0px';

    // 清空搜尋好友提示
    addFriendResult.textContent = '';
    checkFriend(token);
});

const emailContent = document.querySelector('.email-content');
const chatMessagesSetting  = document.querySelector('.chat-messages_setting ');

iconSetting.addEventListener('click', () => {
    chatIndex.style.display = 'none';
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
    settingPic.style.backgroundImage = `url(${myIcon})`;

    console.log('一開始'+myName);
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
    if (this.textContent === ' ') {
        // 切換到編輯模式
        nameContent.contentEditable = true;
        nameContent.focus();
        this.textContent = '  ';
    } else {
        // 完成編輯，將資料傳送到資料庫
        const newName = nameContent.textContent.trim();
        // 在這裡將 newName 送到資料庫進行更新
        changeName(token, newName);

        // 切換回非編輯模式
        nameContent.contentEditable = false;
        this.textContent = '';
    }
});

// 修改姓名的API（確認中！！！！！！！）
async function changeName(token, newName) {
    try {
        let response = await fetch('/api/changeName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newName }),
        });

        const data = await response.json();

        if (response.status === 200) {
            nameContent.textContent = newName;
            chatHeaderName.textContent = newName;

            myName = newName;
        } else {
            addFriendResult.textContent = data.error;
            console.log(data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 修改圖片
const profilePic = document.getElementById('profilePic');
const changeProfilePic = document.getElementById('changeProfilePic');
const fileInput = document.getElementById('fileInput');

changeProfilePic.addEventListener('click', function () {
    // 觸發檔案選擇
    fileInput.click();
});

const settingPic = document.querySelector('.setting-pic');

fileInput.addEventListener('change', async function () {
    const selectedFile = fileInput.files[0];

    // 限制只能夠上傳圖片檔
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (!allowedImageTypes.includes(selectedFile.type)) {
        alert('請選擇有效的圖片檔案（JPEG 或 PNG）');
        fileInput.value = ''; // 清空檔案輸入框的值
        return; // 中止後續的處理
    } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
    
        try {
            // 使用 await 等待 fetch 完成
            const response = await fetch('/api/changeMemberIcon', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            const data = await response.json();
            const fileURL = data.message;
    
            if (response.status === 200) {
                console.log(fileURL);
                myIcon = fileURL;
                settingPic.style.backgroundImage = `url(${myIcon})`;
                chatHeaderIcon.style.backgroundImage = `url(${myIcon})`;

            } else {
                console.log(data.error);
            }
        } catch (error) {
            console.error('錯誤：', error);
        }
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
        addFriendResult.style.marginBottom = '15px';

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
        console.log(friendData);

        // 每次進入都先清空待確認好友名單
        addFriendCheck.innerHTML = '';

        if (response.status === 200) {
            friendData.forEach(({ email, name, icon }) => {
                let friendList = document.createElement('div');
                friendList.className = 'addFriend-list';

                let friendIcon = document.createElement('div');
                friendIcon.className = 'showFriendIcon';
                friendIcon.style.backgroundImage = `url(${icon})`;
            
                let friendName = document.createElement('div');
                friendName.className = 'friendName';
                friendName.textContent = name;
            
                let friendAgree = document.createElement('div');
                friendAgree.className = 'friendAgree';
                friendAgree.addEventListener('click', () => {
                    friendAnswerApi(name, 'O');
                });
            
                let friendRefuse = document.createElement('div');
                friendRefuse.className = 'friendRefuse';
                friendRefuse.addEventListener('click', () => {
                    friendAnswerApi(name, 'X');
                });
            
                friendList.appendChild(friendIcon);                
                friendList.appendChild(friendName);
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
            friendData.forEach(({ friendId, name, icon, roomId }) => {
                let friendList = document.createElement('div');
                friendList.className = 'showFriendList';
            
                let friendIcon = document.createElement('div');
                friendIcon.className = 'showFriendIcon';
                friendIcon.style.backgroundImage = `url(${icon})`;

                let friendName = document.createElement('div');
                friendName.textContent = name;
                friendName.className = 'showFriendName';

                friendList.addEventListener('click', () => {
                    // 取得歷史訊息
                    getHistoryMessage(token, roomId)
                    // 將好友加入 Socket.io room（測試中）
                    socket.emit('join room', { room: roomId });
                    currentRoomId = roomId;
                    currentFriendId = friendId;

                    chatIndex.style.display = 'none';
                    ul.innerHTML= '';
                    showTalkPage(name, icon, roomId, friendId);
                });
            
                friendList.appendChild(friendIcon);
                friendList.appendChild(friendName);
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
const chatPartnerIcon = document.querySelector('.chat-partner_icon');
const chatPartnerName = document.querySelector('.chat-partner_name');

function showTalkPage(name, icon, roomId, friendId) {
    chatMessagesSetting.style.display = 'none';
    chatPartnerIcon.style.backgroundImage = `url(${icon})`;
    chatPartnerName.textContent = name;
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

    // 創建 file-input
    const fileChatInput = document.createElement('input');
    fileChatInput.type = 'file';
    fileChatInput.style.display = 'none';


    // 添加事件監聽器，當選擇檔案時觸發
    fileChatInput.addEventListener('change', handleFileSelect);

    // 選擇圖片按鈕點擊時觸發檔案選擇
    uploadButton.addEventListener('click', () => {
        fileChatInput.click();
    });

    // 處理選擇檔案的函數
    async function handleFileSelect() {
        const selectedFile = fileChatInput.files[0];

        // 限制可以上傳的檔案類型（先只能上傳圖片）
        const selectedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!selectedFileTypes.includes(selectedFile.type)) {
            alert('僅能選擇圖片檔');
            return; // 中止後續的處理
        } else {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('roomID', currentRoomId); // 添加 roomID
            formData.append('senderID', currentUserId); // 添加 senderID
            formData.append('receiverID', currentFriendId); // 添加 roomID

            try {
                // 使用 await 等待 fetch 完成
                const response = await fetch('/api/addPicture', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                });
                const data = await response.json();
                const fileURL = data.message;
        
                // 要怎麼處理還在確認中
                if (response.status === 200) {
                    socket.emit('chat image', { room: currentRoomId, currentUserId, currentFriendId, fileURL });
                } else {
                    console.log(data.error);
                }




                // 使用 FileReader 讀取圖片內容
                // const reader = new FileReader();             

                // reader.onload = (event) => {
                //     const imageData = event.target.result;

                //     // 使用 Socket.io 將圖片資料傳送到後端
                //     socket.emit('send image', { room: roomId, currentUserId, currentFriendId, imageData, fileType: selectedFile.type });
                // };

                // // 讀取圖片內容（暫不需要）
                // reader.readAsDataURL(selectedFile);
            } catch (error) {
                console.error('錯誤：', error);
            }
        }
    }

    // 添加上傳圖片按鈕到左邊容器
    leftContainer.appendChild(uploadButton);
    leftContainer.appendChild(fileChatInput);

    // 將 chatInputDiv 添加到 chatFooter
    chatInputContainer.appendChild(leftContainer);
    chatInputContainer.appendChild(chatInputDiv);


    const chatInput = document.createElement('textarea');
    chatInput.type = 'text';
    chatInput.className = 'chat-input';
    chatInput.placeholder = '輸入訊息';

    const sendButton = document.createElement('div');
    sendButton.className = 'chat-button';

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
        console.log(history);

        if (response.status === 200) {
            history.forEach(({ sender_id, receiver_id, message, time, icon }) => {
                createMessageElement(sender_id, receiver_id, message, time, icon);
            });

        } else {
            console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};


function createMessageElement(sender_id, receiver_id, message, time, icon) {
    chatIndex.style.display = 'none';
    const messageContainer = document.createElement('div');
    const textMessage = document.createElement('div');
    const textTime = document.createElement('div');

    const formattedDateTime = formatDateTime(time);
    textTime.textContent = formattedDateTime;
    textTime.className = 'textTime'

    if (currentUserId === sender_id) {
        // 将消息容器放在右边
        messageContainer.className = 'messageContainerRight';    

        if (isImageURL(message)) {
            // 如果是圖片網址，將圖片設為背景圖
            textMessage.className = 'chatImageRight';
            textMessage.style.backgroundImage = `url(${message})`;
        } else {
            // 如果是文字訊息，則創建文字消息元素
            textMessage.textContent = message;
            textMessage.className = 'textMessageRight'
        }
        messageContainer.appendChild(textTime);
        messageContainer.appendChild(textMessage);
    } else {
        messageContainer.className = 'messageContainerLeft';

        let messageIcon = document.createElement('div');
        messageIcon.className = 'showFriendIcon';
        messageIcon.style.backgroundImage = `url(${icon})`;

        if (isImageURL(message)) {
            // 如果是圖片網址，將圖片設為背景圖
            textMessage.className = 'chatImageLeft';
            textMessage.style.backgroundImage = `url(${message})`;
        } else {
            // 如果是文字訊息，則創建文字消息元素
            textMessage.textContent = message;
            textMessage.className = 'textMessageLeft'
        }
        messageContainer.appendChild(messageIcon);        
        messageContainer.appendChild(textMessage);
        messageContainer.appendChild(textTime);
    }

    // if (isImageURL(message) && currentUserId === sender_id) {
    //     // 如果是圖片網址，將圖片設為背景圖
    //     textMessage.className = 'chatImage';
    //     textMessage.style.backgroundImage = `url(${message})`;
    // } else (isImageURL(message) && currentUserId !== sender_id) {
    //     // 如果是文字訊息，則創建文字消息元素
    //     textMessage.textContent = message;
    // }

    // // 如果 currentUserId 等于 sender_id，则是自己的消息
    // if (currentUserId === sender_id) {
    //     // 设置底色为淺綠色
    //     textMessage.className = 'textMessageRight'
    //     // 将消息容器放在右边
    //     messageContainer.className = 'messageContainerRight';       

    //     messageContainer.appendChild(textTime);
    //     messageContainer.appendChild(textMessage);
    // } else {
    //     // 设置底色为灰色
    //     textMessage.className = 'textMessageLeft'
    //     // 将消息容器放在左边
    //     messageContainer.className = 'messageContainerLeft';     

    //     messageContainer.appendChild(textMessage);
    //     messageContainer.appendChild(textTime); 
    // }

    // 将文本消息添加到消息容器
    ul.appendChild(messageContainer);

    // 滾動到底部
    ul.scrollTop = ul.scrollHeight;
}

// 判斷是否為圖片網址
function isImageURL(url) {
    // 這只是一個簡單的檢查，您可能需要一些更複雜的邏輯來確認 URL 是否是圖片 URL
    return /\.(jpeg|jpg|gif|png)$/i.test(url);
}


// 生成歷史訊息（確認中、原本）
// function createMessageElement(sender_id, receiver_id, message, time) {

//     chatIndex.style.display = 'none';
//     const messageContainer = document.createElement('div');
//     const textMessage = document.createElement('div');
//     textMessage.textContent = message;

//     // 添加适当的样式和边框
//     textMessage.style.border = '1px solid #aaaaaa';
//     textMessage.style.borderRadius = '10px';
//     textMessage.style.padding = '7px';
//     messageContainer.style.marginBottom = '5px'; // 调整此处的 margin
//     messageContainer.style.padding = '5px'; // 调整此处的 padding

//     // 如果 currentUserId 等于 sender_id，则是自己的消息
//     if (currentUserId === sender_id) {
//         // 设置底色为淺綠色
//         textMessage.style.backgroundColor = '#c1ecc1';
//         // 设置文本右对齐
//         textMessage.style.textAlign = 'right';
//         // 将消息容器放在右边
//         messageContainer.style.marginLeft = 'auto';
//         messageContainer.style.textAlign = 'right';
//     } else {
//         // 设置底色为灰色
//         textMessage.style.backgroundColor = '#d9d9d9';
//         // 设置文本左对齐
//         textMessage.style.textAlign = 'left';
//         // 将消息容器放在左边
//         messageContainer.style.marginRight = 'auto';
//         messageContainer.style.textAlign = 'left';
//     }

//     // 使边框包裹文字
//     textMessage.style.display = 'inline-block';

//     // 将文本消息添加到消息容器
//     messageContainer.appendChild(textMessage);
//     ul.appendChild(messageContainer);

//     // 滚动到底部
//     ul.scrollTop = ul.scrollHeight;
// }




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
        console.log(messageList);

        if (response.status === 200) {
            messageListCheck.innerHTML= '';

            messageList.forEach(({ friend_id, room_id, name, friendEmail, icon, finalMessage, finalMessageTime }) => {
                createMessageList(friend_id, room_id, name, friendEmail, icon, finalMessage, finalMessageTime);
            });

        } else {
            console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 建立聊天列表（確認中）
function createMessageList(friend_id, room_id, name, friendEmail, icon, finalMessage, finalMessageTime) {
    const formattedDateTime = formatDateTime(finalMessageTime);

    let messageList = document.createElement('div');
    messageList.className = 'showMessageList'; 

    let messageIcon = document.createElement('div');
    messageIcon.className = 'showFriendIcon';
    messageIcon.style.backgroundImage = `url(${icon})`;

    let messageData = document.createElement('div');
    messageData.className = 'showData';

    let messageDataContainer = document.createElement('div');
    messageDataContainer.className = 'showData_container';

    let messageFriendMessage = document.createElement('div');
    messageFriendMessage.className = 'showFriendMessage';
    if (isImageURL(finalMessage)) {
        messageFriendMessage.textContent = '已傳送圖片';
    } else {
        messageFriendMessage.textContent = finalMessage;
    }

    let messageFriendName = document.createElement('div');
    messageFriendName.textContent = name;
    messageFriendName.className = 'messageFriendName';

    let messageFriendTime = document.createElement('div');
    messageFriendTime.textContent = formattedDateTime;
    messageFriendTime.className = 'showFriendTime';

    messageList.addEventListener('click', () => {
        // 取得歷史訊息
        getHistoryMessage(token, room_id)
        // 將好友加入 Socket.io room（測試中）
        socket.emit('join room', { room: room_id });
        currentRoomId = room_id;
        currentFriendId = friend_id;

        ul.innerHTML= '';
        showTalkPage(name, icon, room_id, friend_id);
    });

    messageDataContainer.appendChild(messageFriendName);
    messageDataContainer.appendChild(messageFriendTime);
    messageData.appendChild(messageDataContainer);
    messageData.appendChild(messageFriendMessage);
    messageList.appendChild(messageIcon);
    messageList.appendChild(messageData);
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

function appendMessageToUI(message, sender_id, time) {

    const messageContainer = document.createElement('div');
    const textMessage = document.createElement('div');
    const textTime = document.createElement('div');

    const formattedDateTime = formatDateTime(time);
    textTime.textContent = formattedDateTime;
    textTime.className = 'textTime'

    if (currentUserId === sender_id) {
        // 将消息容器放在右边
        messageContainer.className = 'messageContainerRight';    

        if (isImageURL(message)) {
            // 如果是圖片網址，將圖片設為背景圖
            textMessage.className = 'chatImageRight';
            textMessage.style.backgroundImage = `url(${message})`;
        } else {
            // 如果是文字訊息，則創建文字消息元素
            textMessage.textContent = message;
            textMessage.className = 'textMessageRight'
        }
        messageContainer.appendChild(textTime);
        messageContainer.appendChild(textMessage);
    } else {
        messageContainer.className = 'messageContainerLeft';     

        if (isImageURL(message)) {
            // 如果是圖片網址，將圖片設為背景圖
            textMessage.className = 'chatImageLeft';
            textMessage.style.backgroundImage = `url(${message})`;
        } else {
            // 如果是文字訊息，則創建文字消息元素
            textMessage.textContent = message;
            textMessage.className = 'textMessageLeft'
        }
        messageContainer.appendChild(textMessage);
        messageContainer.appendChild(textTime);
    }

    // 将消息容器添加到聊天窗口
    ul.appendChild(messageContainer);
    ul.scrollTop = ul.scrollHeight;
}



function appendImageToUI(message, sendUserId, time) {
    console.log(message, sendUserId, time);
    const messageContainer = document.createElement('div');
    const textMessage = document.createElement('div');
    const textTime = document.createElement('div');

    const formattedDateTime = formatDateTime(time);
    textTime.textContent = formattedDateTime;
    textTime.className = 'textTime'

    if (currentUserId === sendUserId) {
        // 将消息容器放在右边
        messageContainer.className = 'messageContainerRight';    

        if (isImageURL(message)) {
            // 如果是圖片網址，將圖片設為背景圖
            textMessage.className = 'chatImageRight';
            textMessage.style.backgroundImage = `url(${message})`;
        } else {
            // 如果是文字訊息，則創建文字消息元素
            textMessage.textContent = message;
            textMessage.className = 'textMessageRight'
        }
        messageContainer.appendChild(textTime);
        messageContainer.appendChild(textMessage);
    } else {
        messageContainer.className = 'messageContainerLeft';     

        if (isImageURL(message)) {
            // 如果是圖片網址，將圖片設為背景圖
            textMessage.className = 'chatImageLeft';
            textMessage.style.backgroundImage = `url(${message})`;
        } else {
            // 如果是文字訊息，則創建文字消息元素
            textMessage.textContent = message;
            textMessage.className = 'textMessageLeft'
        }
        messageContainer.appendChild(textMessage);
        messageContainer.appendChild(textTime);
    }
    ul.appendChild(messageContainer);
    ul.scrollTop = ul.scrollHeight;
}

socket.on('chat message', (data) => {
    const { room, message, currentUserId, time } = data;
    console.log('我是時間'+time);
    
    // 在前端顯示消息
    if (room === currentRoomId) {
        appendMessageToUI(message, currentUserId, time);
    }
});


socket.on('chat image', (data) => {
    const { room, fileURL, currentUserId, time } = data;
    
    // 在前端顯示消息
    if (room === currentRoomId) {
        appendImageToUI(fileURL, currentUserId, time);
    }
});

// 統整的版本
const callButton = document.querySelector('.callButton');
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