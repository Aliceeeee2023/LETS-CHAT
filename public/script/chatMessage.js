function formatNowDateTime(isoString) {
    const date = new Date(isoString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = (date.getHours()).toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month}-${day} ${hours}:${minutes}`;
};

function isImageURL(url) {
    return /\.(jpeg|jpg|gif|png)$/i.test(url);
};

function isVideoURL(url) {
    return /\.(mp4|webm)$/i.test(url);
};

async function getMessageList(token) {
    try {
        let response = await fetch('/api/getMessageList', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        let data = await response.json();
        let messageList = data.messageList;

        if (response.status === 200) {
            messageListCheck.innerHTML= '';

            messageList.forEach(({ friend_id, room_id, name, friendEmail, icon, status, finalMessage, finalMessageTime }) => {
                createMessageList(friend_id, room_id, name, friendEmail, icon, status, finalMessage, finalMessageTime);
            });
        } else {
            // console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

function createMessageList(friend_id, room_id, name, friendEmail, icon, status, finalMessage, finalMessageTime) {
    const formattedDateTime = formatNowDateTime(finalMessageTime);

    let messageList = document.createElement('div');
    messageList.className = 'showMessageList';
    messageList.setAttribute('room', room_id);

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
    } else if (isVideoURL(finalMessage)) {
        messageFriendMessage.textContent = '已傳送影片';
    } else{
        messageFriendMessage.textContent = finalMessage;
    };

    let messageFriendName = document.createElement('div');
    messageFriendName.textContent = name;
    messageFriendName.className = 'messageFriendName';

    let messageFriendTime = document.createElement('div');
    messageFriendTime.textContent = formattedDateTime;
    messageFriendTime.className = 'showFriendTime';

    messageList.addEventListener('click', () => {
        getHistoryMessage(token, room_id)
        socket.emit('join room', { room: room_id });
        currentRoomId = room_id;
        currentFriendId = friend_id;

        ul.innerHTML= '';
        showTalkPage(name, icon, status, room_id, friend_id);
    });

    messageDataContainer.appendChild(messageFriendName);
    messageDataContainer.appendChild(messageFriendTime);
    messageData.appendChild(messageDataContainer);
    messageData.appendChild(messageFriendMessage);
    messageList.appendChild(messageIcon);
    messageList.appendChild(messageData);
    messageListCheck.appendChild(messageList);
};

function showTalkPage(name, icon, status, roomId, friendId) {
    currentFriendName = name;
    currentFriendIcon = icon;
    chatHeaderSetting.innerHTML = '';
    ul.style.display = 'block';
    chatPartnerIcon.style.display = 'block';
    chatMessagesSetting.style.display = 'none';
    chatPartnerIcon.style.backgroundImage = `url(${icon})`;
    chatPartnerName.textContent = name;
    chatPartnerStatus.textContent = status;
    callButton.style.display = 'block';

    chatInputContainer.innerHTML = '';
    const chatInputDiv = document.createElement('div');
    chatInputDiv.className = 'chat-footer_input';

    const leftContainer = document.createElement('div');
    leftContainer.className = 'left-container';

    const emojiButton = document.createElement('div');
    emojiButton.className = 'upload-emoji';

    const uploadButton = document.createElement('div');
    uploadButton.className = 'upload-button';

    const fileChatInput = document.createElement('input');
    fileChatInput.type = 'file';
    fileChatInput.style.display = 'none';

    fileChatInput.addEventListener('change', handleFileSelect);

    emojiButton.addEventListener('click', (event) => {
        event.stopPropagation();

        if (getComputedStyle(emoji).display === 'none') {
            emoji.style.display = 'block';
        } else {
            emoji.style.display = 'none';
        };
    });

    document.addEventListener('click', (event) => {
        if (getComputedStyle(emoji).display === 'block' && !emojiButton.contains(event.target) && !emoji.contains(event.target)) {
            emoji.style.display = 'none';
        };
    });

    uploadButton.addEventListener('click', () => {
        fileChatInput.click();
    });

    async function handleFileSelect() {
        const maxFileSizeMB = 5;
        const selectedFile = fileChatInput.files[0];
        const selectedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];

        if (!selectedFileTypes.includes(selectedFile.type)) {
            alert('僅能選擇圖片或影音檔');
            return;
        } else if (selectedFile.size > maxFileSizeMB * 1024 * 1024) {
            alert('請勿上傳超過 5MB 的檔案');
            return;
        } else {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('roomID', currentRoomId);
            formData.append('senderID', currentUserId);
            formData.append('receiverID', currentFriendId);

            try {
                const response = await fetch('/api/addFile', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                });
                const data = await response.json();
                const fileURL = data.message;
        
                if (response.status === 200) {
                    socket.emit('chat image', { room: currentRoomId, currentUserId, currentFriendId, fileURL });
                } else {
                    // console.error(data.error);
                }
            } catch (error) {
                console.error('錯誤：', error);
            };
        };
    };
    
    leftContainer.appendChild(emojiButton);
    leftContainer.appendChild(uploadButton);
    leftContainer.appendChild(fileChatInput);

    chatInputContainer.appendChild(leftContainer);
    chatInputContainer.appendChild(chatInputDiv);

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.maxLength = 25;
    chatInput.className = 'chat-input';
    chatInput.placeholder = '輸入訊息';

    const sendButton = document.createElement('div');
    sendButton.className = 'chat-button';

    chatInputDiv.appendChild(chatInput);

    chatInputContainer.appendChild(chatInputDiv);
    chatInputContainer.appendChild(sendButton);

    emoji.addEventListener('click', function(event) {
        if (event.target.classList.contains('emoji-span')) {
            const selectedEmoji = event.target.textContent;
            chatInput.value += selectedEmoji;
        };
    });

    sendButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message !== '') {
            socket.emit('chat message', { room: roomId, currentUserId, currentFriendId, message });
            chatInput.value = '';
        };
    });
};

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
            history.forEach(({ sender_id, receiver_id, message, time, icon }) => {
                createMessageElement(sender_id, receiver_id, message, time, icon);
            });

        } else if (data.error === '無歷史對話紀錄') {
            chatIndex.style.display = 'none';
            chatMessagesContent.style.borderTop = 'solid 1px #c4c0c0';
            chatMessagesContent.style.borderBottom = 'solid 1px #c4c0c0';
        } else {
            // console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

function createMessageElement(sender_id, receiver_id, message, time, icon) {
    chatIndex.style.display = 'none';
    chatMessagesContent.style.borderTop = 'solid 1px #c4c0c0';
    chatMessagesContent.style.borderBottom = 'solid 1px #c4c0c0';
    const messageContainer = document.createElement('div');
    const textMessage = document.createElement('div');
    const textTime = document.createElement('div');

    const formattedDateTime = formatNowDateTime(time);
    textTime.textContent = formattedDateTime;
    textTime.className = 'textTime';

    if (currentUserId === sender_id) {
        messageContainer.className = 'messageContainerRight';    

        if (isImageURL(message)) {
            textMessage.className = 'chatImageRight';
            textMessage.style.backgroundImage = `url(${message})`;
        } else if (isVideoURL(message)) {
            const videoElement = document.createElement('video');
            videoElement.className = 'chatVideoRight';
            videoElement.controls = true;
            videoElement.innerHTML = `<source src="${message}" type="video/mp4">`;
        
            textMessage.appendChild(videoElement);
        } else {
            textMessage.textContent = message;
            textMessage.className = 'textMessageRight'
        };
        messageContainer.appendChild(textTime);
        messageContainer.appendChild(textMessage);
    } else {
        messageContainer.className = 'messageContainerLeft';

        let messageIcon = document.createElement('div');
        messageIcon.className = 'showFriendIcon';
        messageIcon.style.backgroundImage = `url(${icon})`;

        if (isImageURL(message)) {
            textMessage.className = 'chatImageLeft';
            textMessage.style.backgroundImage = `url(${message})`;
        } else if (isVideoURL(message)) {
            const videoElement = document.createElement('video');
            videoElement.className = 'chatVideoLeft';
            videoElement.controls = true;
            videoElement.innerHTML = `<source src="${message}" type="video/mp4">`;
        
            textMessage.appendChild(videoElement);
        } else {
            textMessage.textContent = message;
            textMessage.className = 'textMessageLeft'
        };
        messageContainer.appendChild(messageIcon);        
        messageContainer.appendChild(textMessage);
        messageContainer.appendChild(textTime);
    };

    ul.appendChild(messageContainer);
    ul.scrollTop = ul.scrollHeight;
};

function appendMessageToUI(message, sender_id, time, icon) {
    const messageContainer = document.createElement('div');
    const textMessage = document.createElement('div');
    const textTime = document.createElement('div');

    const formattedDateTime = formatNowDateTime(time);
    textTime.textContent = formattedDateTime;
    textTime.className = 'textTime';

    if (currentUserId === sender_id) {
        messageContainer.className = 'messageContainerRight';    

        if (isImageURL(message)) {
            textMessage.className = 'chatImageRight';
            textMessage.style.backgroundImage = `url(${message})`;
        } else if (isVideoURL(message)) {
            const videoElement = document.createElement('video');
            videoElement.className = 'chatVideoRight';
            videoElement.controls = true;
            videoElement.innerHTML = `<source src="${message}" type="video/mp4">`;
        
            textMessage.appendChild(videoElement);
        } else {
            textMessage.textContent = message;
            textMessage.className = 'textMessageRight'
        };
        messageContainer.appendChild(textTime);
        messageContainer.appendChild(textMessage);
    } else {
        messageContainer.className = 'messageContainerLeft';     

        let messageIcon = document.createElement('div');
        messageIcon.className = 'showFriendIcon';
        messageIcon.style.backgroundImage = `url(${icon})`;

        if (isImageURL(message)) {
            textMessage.className = 'chatImageLeft';
            textMessage.style.backgroundImage = `url(${message})`;
        } else if (isVideoURL(message)) {
            const videoElement = document.createElement('video');
            videoElement.className = 'chatVideoLeft';
            videoElement.controls = true;
            videoElement.innerHTML = `<source src="${message}" type="video/mp4">`;
        
            textMessage.appendChild(videoElement);
        } else {
            textMessage.textContent = message;
            textMessage.className = 'textMessageLeft'
        };
        messageContainer.appendChild(messageIcon);     
        messageContainer.appendChild(textMessage);
        messageContainer.appendChild(textTime);
    };

    ul.appendChild(messageContainer);
    ul.scrollTop = ul.scrollHeight;
};