const dataEmailChange = document.querySelector('.data-email_change');
const nameContent = document.querySelector('.name-content');
const dataNameChange = document.querySelector('.data-name_change');
const StatusContent = document.querySelector('.status-content');
const StatusNoContent = document.querySelector('.status-nocontent');
const dataStatusChange = document.querySelector('.data-status_change');
const profilePic = document.getElementById('profilePic');
const changeProfilePic = document.getElementById('changeProfilePic');
const fileInput = document.getElementById('fileInput');

changeProfilePic.addEventListener('click', function () {
    fileInput.click();
});

dataNameChange.addEventListener('click', function () {
    if (this.textContent === ' ') {
        nameContent.contentEditable = true;
        nameContent.focus();
        this.textContent = '  ';
    } else {
        const newName = nameContent.textContent.trim();
        changeName(token, newName);

        nameContent.contentEditable = false;
        this.textContent = ' ';
    }
});

dataStatusChange.addEventListener('click', function () {
    if (this.textContent === ' ') {
        StatusNoContent.style.display = 'none';
        StatusContent.style.display = 'block';

        StatusContent.contentEditable = true;
        StatusContent.focus();
        this.textContent = '  ';
    } else {
        const newStatus = StatusContent.textContent.trim();
        changeStatus(token, newStatus);

        StatusContent.contentEditable = false;
        this.textContent = ' ';
    }
});

dataEmailChange.addEventListener('click', function () {
    if (this.textContent === ' ') {
        emailContent.contentEditable = true;
        emailContent.focus();
        this.textContent = '  ';
    } else {
        const newEmail = emailContent.textContent.trim();
        emailContent.contentEditable = false;
        this.textContent = ' ';
    }
});

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
            // console.error(data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

async function changeStatus(token, newStatus) {
    try {
        let response = await fetch('/api/changeStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newStatus }),
        });
        const data = await response.json();

        if (response.status === 200 && newStatus == "") {
            StatusNoContent.style.display = 'block';
            StatusContent.style.display = 'none';

            StatusContent.textContent = null;
            chatHeaderStatus.textContent = null;
            myStatus = null;
        } else if (response.status === 200 && newStatus !== "") {
            StatusNoContent.style.display = 'none';
            StatusContent.style.display = 'block';

            StatusContent.textContent = newStatus;
            chatHeaderStatus.textContent = newStatus;
            myStatus = newStatus;
        } else {
            addFriendResult.textContent = data.error;
            // console.error(data.error);
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};

fileInput.addEventListener('change', async function () {
    const selectedFile = fileInput.files[0];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (!allowedImageTypes.includes(selectedFile.type)) {
        alert('請選擇有效的圖片檔案（JPEG 或 PNG）');
        fileInput.value = '';
        return;
    } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
    
        try {
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
                myIcon = fileURL;
                settingPic.style.backgroundImage = `url(${myIcon})`;
                chatHeaderIcon.style.backgroundImage = `url(${myIcon})`;
            } else {
                // console.error(data.error);
            }
        } catch (error) {
            console.error('錯誤：', error);
        }
    }
});