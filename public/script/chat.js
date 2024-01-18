const token = localStorage.getItem('token');
const logo = document.querySelector('.header-title');
const logout = document.querySelector('.header-nav_logout');
const chatHeaderUser = document.querySelector('.chat-header_user');
const chatHeaderIcon = document.querySelector('.chat-header_icon');
const chatHeaderName = document.querySelector('.chat-header_name');
const chatHeaderStatus = document.querySelector('.chat-header_status');
const chatMessagesContent = document.querySelector('.chat-messages_content');
const chatInputContainer = document.querySelector('.chat-input_container');  
const MessagesList = document.querySelector('.chat-messagesList');
const FriendList = document.querySelector('.chat-friendList');
const AddFriend = document.querySelector('.chat-addFriend');
const iconMessagesList = document.querySelector('.icon_messagesList');
const iconFriendList = document.querySelector('.icon_friendList');
const iconAddFriend = document.querySelector('.icon_addFriend');
const iconSetting = document.querySelector('.icon_setting');
const chatIndex = document.querySelector('.chat-index');
const emailContent = document.querySelector('.email-content');
const chatMessagesSetting  = document.querySelector('.chat-messages_setting');
const chatHeaderSetting = document.querySelector('.chat-header_setting');
const chatPartnerIcon = document.querySelector('.chat-partner_icon');
const chatPartnerName = document.querySelector('.chat-partner_name');
const settingPic = document.querySelector('.setting-pic');
const AddFriendButton = document.querySelector('.addFriend-button');
const addFriendResult = document.querySelector('.addFriend-result');
const addFriendCheck = document.querySelector('.addFriend-check');
const messageListCheck = document.querySelector('.messagesList-check');
const friendListCheck = document.querySelector('.friendList-check');
const ul = document.querySelector('.ul');

let myName = null;
let myEmail = null;
let myIcon = null;
let myStatus = null;
let currentUserId = null;
let currentFriendId = null;
let currentRoomId = null;
let currentFriendName = null;
let currentFriendIcon = null;

const socket = io();

logo.addEventListener('click', () => {
    window.location.href = '/';
});

logout.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.reload();
});

document.addEventListener('DOMContentLoaded', () => {
    checkUsers(token).then(() => {
        socket.emit('set-current-user', { currentUserId });
        showFriendList(token);
    });
});

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
            myName = data.name;
            myIcon = data.icon;
            myEmail = data.email;
            myStatus = data.status;
            chatHeaderName.textContent = myName;
            chatHeaderStatus.textContent = myStatus;            
            chatHeaderIcon.style.backgroundImage = `url(${myIcon})`;

            document.body.style.display = 'block';     
        } else if (response.status === 400) {
            window.location.href = '/';
            // console.error('未登入帳號');
        } else {
            window.location.href = '/';
            // console.error('伺服器內部錯誤');
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

function reset() {
    ul.innerHTML = '';
    chatInputContainer.innerHTML = '';
    chatPartnerName.innerHTML = '';
    chatPartnerIcon.style.display = 'none';
    callButton.style.display = 'none';
};

function resetExceptSetting() {
    chatMessagesSetting.style.display = 'none';
    chatIndex.style.display = 'flex';
    chatHeaderSetting.innerHTML = '';
    chatMessagesContent.style.borderTop = 'none';
    chatMessagesContent.style.borderBottom = 'none';
};

iconMessagesList.addEventListener('click', () => {
    MessagesList.style.display = 'block';
    AddFriend.style.display = 'none';    
    FriendList.style.display = 'none';   

    reset();
    resetExceptSetting();
    getMessageList(token);
});

iconFriendList.addEventListener('click', () => {
    FriendList.style.display = 'block'; 
    MessagesList.style.display = 'none';
    AddFriend.style.display = 'none';

    reset();
    resetExceptSetting();
    showFriendList(token);
});

iconAddFriend.addEventListener('click', () => {
    AddFriend.style.display = 'block';  
    MessagesList.style.display = 'none';
    FriendList.style.display = 'none';
    addFriendResult.textContent = '';
    addFriendResult.style.marginBottom = '0px';

    reset();
    resetExceptSetting();
    checkFriend(token);
});

iconSetting.addEventListener('click', () => {
    chatIndex.style.display = 'none';
    chatMessagesSetting.style.display = 'block';
    chatHeaderSetting.textContent = '會員資料設定';
    settingPic.style.backgroundImage = `url(${myIcon})`;
    nameContent.textContent = myName;
    emailContent.textContent = myEmail;
    chatMessagesContent.style.borderTop = 'solid 1px #c4c0c0';
    chatMessagesContent.style.borderBottom = 'none';

    if(myStatus == null) {
        StatusContent.style.display = 'none';
        StatusNoContent.style.display = 'block';
    } else {
        StatusContent.style.display = 'block';
        StatusNoContent.style.display = 'none';    
        StatusContent.textContent = myStatus;
    };

    reset();
    showFriendList(token);
});

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
                    getHistoryMessage(token, roomId)
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
            // console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};