const signupButton = document.querySelector('.signup-button');
const loginLinkSpan = document.querySelector('.login-link-span');
const signupError = document.querySelector('.signup-error');
const token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    signupError.style.display = 'none';
    document.body.style.display = 'none';
    checkUsers(token);
});

loginLinkSpan.addEventListener('click', () => {
    window.location.href = '/login';
});

signupButton.addEventListener('click', () => {
    submitSignupForm();
});

function checkEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

function checkPassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
    return passwordRegex.test(password);
};

function checkNickname(name) {
    const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z]+$/;
    return nicknameRegex.test(name);
}

async function submitSignupForm() {
    let emailInput = document.querySelector('.signup-email');
    let nameInput = document.querySelector('.signup-name');    
    let passwordInput = document.querySelector('.signup-password');
    let email = emailInput.value;
    let name = nameInput.value;
    let password = passwordInput.value;

    signupError.style.display = 'block';

    if (!email || !password || !name) {
        signupError.textContent = '註冊資料不可為空';
    } else if (!checkEmail(email)) {
        signupError.textContent = '無效的電子郵件格式';
    } else if (!checkNickname(name)) {
        signupError.textContent = '無效的暱稱格式';
    } else if (!checkPassword(password)) {
        signupError.textContent = '無效的密碼格式';
    } else {
        emailInput.value = '';
        nameInput.value = '';
        passwordInput.value = '';
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify({ email, name, password }),
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
        } else {
            document.body.style.display = 'block';
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};