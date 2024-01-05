const peer = new Peer();
const callButton = document.querySelector('.callButton');
const callRequestModal = document.getElementById('callRequestModal');
const cancelCallButton = document.querySelector('.cancelCallButton');
const callResponseModal = document.getElementById('callResponseModal');
const acceptCallButton = document.querySelector('.acceptCallButton');
const rejectCallButton = document.querySelector('.rejectCallButton');
const callInProgressModal = document.getElementById('callInProgressModal');
const hangupButton = document.querySelector('.hangupButton');
const localAudio = document.getElementById('localAudio');
const remoteAudio = document.getElementById('remoteAudio');
const callRequestIcon = document.querySelector('.callRequestIcon');
const callRequestName = document.querySelector('.callRequestName');
const callResponseIcon = document.querySelector('.callResponseIcon');
const callResponseName = document.querySelector('.callResponseName');
const callProgressIcon = document.querySelector('.callProgressIcon');
const callProgressName = document.querySelector('.callProgressName');

let currentCall = null;
let currentCallerId = null;
let currentCallName = null;
let currentCallIcon = null;
let callRequestId = null;
let callAcceptId = null;
let peerRequestId = null;
let peerAcceptId = null;


// 將訊息視窗移動至最上方
function updateMessageList(room, message, time) {
    const messageLists = document.querySelectorAll('.showMessageList');

    messageLists.forEach((messageList) => {
        const roomAttribute = messageList.getAttribute('room');
        const roomAttributeAsNumber = parseInt(roomAttribute, 10);

        if (roomAttributeAsNumber  === room) {
            const messageFriendTime = messageList.querySelector('.showFriendTime');
            const messageFriendMessage = messageList.querySelector('.showFriendMessage');

            const formattedDateTime = formatNowDateTime(time);
            messageFriendTime.textContent = formattedDateTime;

            if (isImageURL(message)) {
                messageFriendMessage.textContent = '已傳送圖片';
            } else {
                messageFriendMessage.textContent = message;
            };

            messageListCheck.prepend(messageList);
        };
    });
};


// 通話相關按鈕處理
callButton.addEventListener('click', async () => {
    try {
        socket.emit('call-request', { currentUserId, currentFriendId });
        showCallRequestModal(currentFriendName, currentFriendIcon);
    } catch (error) {
        console.error(error);
    };
});

cancelCallButton.addEventListener('click', () => {
    try {
        closeCallRequestModal();
        socket.emit('cancel-call', { currentFriendId });
    } catch (error) {
        console.error(error);
    };
});

acceptCallButton.addEventListener('click', async () => {
    try {
        socket.emit('accept-call', { acceptId: currentUserId , callerId: currentCallerId});
        closeCallResponseModal();
    } catch (error) {
        console.error(error);
    };
});

rejectCallButton.addEventListener('click', () => {
    try {
        closeCallResponseModal();
        socket.emit('reject-call', { currentCallerId });
    } catch (error) {
        console.error(error);
    };
});

hangupButton.addEventListener('click', () => {
    try {
        // 傳遞接受方的 ID，以便後端知道是哪一方發送的掛斷通話通知
        socket.emit('hangup-call', { callRequestId, callAcceptId }); 
        endCall();
    } catch (error) {
        console.error(error);
    };
});


// 對話窗口處理
function showCallRequestModal(currentFriendName) {
    callRequestName.textContent = currentFriendName;
    callRequestIcon.style.backgroundImage = `url(${currentFriendIcon})`;
    callRequestModal.style.display = 'block';
};

function closeCallRequestModal() {
    callRequestModal.style.display = 'none';
};

function showCallResponseModal(callerId, callName, callIcon) {
    callResponseModal.style.display = 'block';
    callResponseName.textContent = callName;
    callResponseIcon.style.backgroundImage = `url(${callIcon})`;
};

function closeCallResponseModal() {
    callResponseModal.style.display = 'none';
};

function showCallInProgressModal(name, icon) {
    callInProgressModal.style.display = 'block';
    callProgressName.textContent = name;
    callProgressIcon.style.backgroundImage = `url(${icon})`;
};

function closeCallInProgressModal() {
    callInProgressModal.style.display = 'none';
};

function endCall() {
    closeCallInProgressModal();

    // 關閉本地音訊流
    const localStream = localAudio.srcObject;
    const tracks = localStream.getTracks();
    tracks.forEach(track => track.stop());

    // 關閉遠程音訊流
    const remoteStream = remoteAudio.srcObject;
    const remoteTracks = remoteStream.getTracks();
    remoteTracks.forEach(track => track.stop());

    if (currentCall) {
        currentCall.close(); // 結束通話對象
    };
};


// 即時文字、圖片相關
socket.on('chat message', (data) => {
    const { room, message, currentUserId, time } = data;
    
    if (room === currentRoomId) {
        appendMessageToUI(message, currentUserId, time, currentFriendIcon);
    };
});

socket.on('chat image', (data) => {
    const { room, fileURL, currentUserId, time } = data;
    
    if (room === currentRoomId) {
        appendMessageToUI(fileURL, currentUserId, time, currentFriendIcon);
    };
});

socket.on('update window', (data) => {
    const { room, message, currentUserId, time } = data;
    updateMessageList(room, message, time);
});

socket.on('update window pic', (data) => {
    const { room, fileURL, currentUserId, time } = data;
    updateMessageList(room, fileURL, time);
});


// 即時通話相關
peer.on('open', (id) => {
    // 將 Peer ID 發送到伺服器
    socket.emit('peer-id', { peerId: id, currentUserId: currentUserId  });
});

peer.on('call', (call) => {
    // 獲取呼叫者的 Peer ID
    const callerPeerId = call.peer;

    if (callerPeerId === peerRequestId) {
        // 獲取本地的聲音
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                localAudio.srcObject = stream;
                localAudio.muted = true;

                return call.answer(stream);
            })
            .then(() => {
                // answer 完成後，處理遠程聲音
                call.on('stream', (remoteStream) => {
                    remoteAudio.srcObject = remoteStream;
                });
            })
            .catch((error) => {
                console.error(error);
            });
    }
});

socket.on('incoming-call', ({ callerId, callName, callIcon }) => {
    currentCallerId = callerId;
    currentCallName = callName;
    currentCallIcon = callIcon;

    // 顯示來自 callerId 的通話請求框
    showCallResponseModal(callerId, callName, callIcon);
});

socket.on('start-webrtc-connection', (data) => {
    closeCallRequestModal();

    const { initiatorId, acceptId, isCaller, callerPeerId, acceptPeerId } = data;
    callRequestId = initiatorId;
    callAcceptId = acceptId;
    peerRequestId = callerPeerId;
    peerAcceptId = acceptPeerId;

    if (isCaller) {
        showCallInProgressModal(currentFriendName, currentFriendIcon);

        // 在這裡觸發 WebRTC 連線的建立流程（假設已經有 localAudio 和 remoteAudio 元素用於顯示音訊）
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            localAudio.srcObject = stream;
            localAudio.muted = true;

            const connection = peer.connect(acceptPeerId);
            connection.on('open', () => {
                connection.send('hi!');
              });

            // 建立 Peer 對象
            const call = peer.call(acceptPeerId, stream);

            call.on('stream', (remoteStream) => {
                remoteAudio.srcObject = remoteStream;
            });
        }).catch((error) => {
            console.error(error);
        });
    } else {
        showCallInProgressModal(currentCallName, currentCallIcon);
    }
});

socket.on('hangup-other-call', () => {
    endCall();
});

socket.on('cancel-other-call', () => {
    closeCallResponseModal();
});

socket.on('reject-other-call', () => {
    closeCallRequestModal();
});