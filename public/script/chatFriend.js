AddFriendButton.addEventListener('click', () => {
    addFriend(token);
});

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
            friendData.forEach(({ email, name, icon }, index) => {
                let friendList = document.createElement('div');
                friendList.className = 'addFriend-list';

                // 幫每個邀請設置一個不重複的ID，在接受後刪除才能精準處理
                const friendIdCheck = `id${index + 1}`;
                friendList.setAttribute('friendIdCheck', friendIdCheck);

                let friendIcon = document.createElement('div');
                friendIcon.className = 'showFriendIcon';
                friendIcon.style.backgroundImage = `url(${icon})`;
            
                let friendName = document.createElement('div');
                friendName.className = 'friendName';
                friendName.textContent = name;
            
                let friendAgree = document.createElement('div');
                friendAgree.className = 'friendAgree';
                friendAgree.addEventListener('click', () => {
                    friendAnswerApi(email, 'O', name , friendIdCheck);
                });
            
                let friendRefuse = document.createElement('div');
                friendRefuse.className = 'friendRefuse';
                friendRefuse.addEventListener('click', () => {
                    friendAnswerApi(email, 'X', name , friendIdCheck);
                });
            
                friendList.appendChild(friendIcon);                
                friendList.appendChild(friendName);
                friendList.appendChild(friendAgree);
                friendList.appendChild(friendRefuse);
                addFriendCheck.appendChild(friendList);
            });
        } else {
            // console.error('錯誤：', data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

// 處理好友申請（接受或拒絕）
async function friendAnswerApi(email, status, name, friendIdCheck) {
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

        if (response.status === 200) {
            const friendListItems = document.querySelectorAll('.addFriend-list');

            friendListItems.forEach(item => {
                const idCheck = item.getAttribute('friendIdCheck');
                
                if (idCheck && idCheck === friendIdCheck) {
                    item.closest('.addFriend-list').remove();
                }
            });
        } else {
            // console.error(data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

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