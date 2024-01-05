const dataEmailChange = document.querySelector('.data-email_change');
const nameContent = document.querySelector('.name-content');
const dataNameChange = document.querySelector('.data-name_change');
const profilePic = document.getElementById('profilePic');
const changeProfilePic = document.getElementById('changeProfilePic');
const fileInput = document.getElementById('fileInput');

changeProfilePic.addEventListener('click', function () {
    fileInput.click();
});

dataNameChange.addEventListener('click', function () {
    if (this.textContent === ' ') {
        // 切換到編輯模式
        nameContent.contentEditable = true;
        nameContent.focus();
        this.textContent = '  ';
    } else {
        // 完成編輯，將資料傳送到資料庫
        const newName = nameContent.textContent.trim();
        changeName(token, newName);

        // 切換回非編輯模式
        nameContent.contentEditable = false;
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

// 修改姓名 API
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

// 修改圖片 API
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