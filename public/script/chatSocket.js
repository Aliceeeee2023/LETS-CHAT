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
            } else if (isVideoURL(message)) {
                messageFriendMessage.textContent = '已傳送影片';
            } else {
                messageFriendMessage.textContent = message;
            };

            messageListCheck.prepend(messageList);
        };
    });
};


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
        socket.emit('hangup-call', { callRequestId, callAcceptId }); 
        endCall();
    } catch (error) {
        console.error(error);
    };
});


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

    const localStream = localAudio.srcObject;
    const tracks = localStream.getTracks();
    tracks.forEach(track => track.stop());

    const remoteStream = remoteAudio.srcObject;
    const remoteTracks = remoteStream.getTracks();
    remoteTracks.forEach(track => track.stop());

    if (currentCall) {
        currentCall.close();
    };
};


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


peer.on('open', (id) => {
    socket.emit('peer-id', { peerId: id, currentUserId: currentUserId  });
});

peer.on('call', (call) => {
    const callerPeerId = call.peer;

    if (callerPeerId === peerRequestId) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                localAudio.srcObject = stream;
                localAudio.muted = true;

                return call.answer(stream);
            })
            .then(() => {
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

        navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            localAudio.srcObject = stream;
            localAudio.muted = true;

            const connection = peer.connect(acceptPeerId);
            connection.on('open', () => {
                connection.send('hi!');
              });

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