const signupButton = document.querySelector('.signup-button');
const loginLinkSpan = document.querySelector('.login-link-span');
const signupError = document.querySelector('.signup-error');
const token = localStorage.getItem('token');

// 進入頁面時重置錯誤訊息狀態
document.addEventListener('DOMContentLoaded', () => {
    signupError.style.display = 'none';
    document.body.style.display = 'none';
    checkUsers(token);
});

// 點擊後跳轉至登入頁面
loginLinkSpan.addEventListener('click', () => {
    window.location.href = '/login';
});

signupButton.addEventListener('click', () => {
    submitSignupForm();
});

// 驗證電子郵件及密碼格式
function checkEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

function checkPassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
    return passwordRegex.test(password);
};

// 驗證暱稱只能是中英文
function checkNickname(name) {
    const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z]+$/;
    return nicknameRegex.test(name);
}

// 將資料送至後端處理
async function submitSignupForm() {
    let emailInput = document.querySelector('.signup-email');
    let nameInput = document.querySelector('.signup-name');    
    let passwordInput = document.querySelector('.signup-password');
    let email = emailInput.value;
    let name = nameInput.value;
    let password = passwordInput.value;

    signupError.style.display = 'block';

    // 檢查資料後無誤送到後端
    if (!email || !password || !name) {
        signupError.textContent = '註冊資料不可為空';
    } else if (!checkEmail(email)) {
        signupError.textContent = '無效的電子郵件格式';
    } else if (!checkNickname(name)) {
        signupError.textContent = '無效的暱稱格式';
    } else if (!checkPassword(password)) {
        signupError.textContent = '無效的密碼格式';
    } else {
        // 清空表單資料
        emailInput.value = '';
        nameInput.value = '';
        passwordInput.value = '';
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify({ email, name, password }), // 名稱作為屬性名，值作為相應屬性的值
            });

            const data = await response.json();           

            if (response.status === 200) {
                signupError.textContent = '已註冊成功，請進入登入畫面';
            } else if (response.status === 400) {
                signupError.textContent = data.error;                
            } else if (response.status === 500) {
                signupError.textContent = '註冊失敗，請聯繫客服';
            };
        } catch (error) {
            console.error('錯誤：', error);
            signupError.textContent = '註冊失敗，請聯繫客服';
        };
    };
};

async function checkUsers(token) {
    try {
        let response = await fetch('/api/login', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        if (response.status === 200) {
            window.location.href = '/chat';
        } else if (response.status === 400) {
            document.body.style.display = 'block';
            // console.error('未登入帳號');
        } else {
            document.body.style.display = 'block';
            // console.error('伺服器內部錯誤');
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};