const loginButton = document.querySelector('.login-button');
const signupLinkSpan = document.querySelector('.signup-link-span');
const loginError = document.querySelector('.login-error');
const token = localStorage.getItem('token');
let emailInput = document.querySelector('.login-email');
let passwordInput = document.querySelector('.login-password');

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.display = 'none';
    loginError.style.display = 'none';
    checkUsers(token);

    emailInput.value = 'test@gmail.com';
    passwordInput.value = 'test1234';
});

signupLinkSpan.addEventListener('click', () => {
    window.location.href = '/signup';
});

loginButton.addEventListener('click', () => {
    submitloginForm();
});

async function submitloginForm() {
    let email = emailInput.value;
    let password = passwordInput.value;

    loginError.style.display = 'block';

    if (!email || !password) {
        loginError.textContent = '登入資料不可為空';
    } else {
        try {
            const response = await fetch('/api/login', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();           

            if (response.status === 200) {
                localStorage.setItem('token', data.token);
                document.body.style.display = 'none';

                window.location.href = '/chat';
            } else if (response.status === 400) {
                emailInput.value = '';
                passwordInput.value = '';

                loginError.textContent = data.error;                
            } else if (response.status === 500) {
                emailInput.value = '';
                passwordInput.value = '';

                loginError.textContent = '登入失敗，請聯繫客服';
            };
        } catch (error) {
            console.error('錯誤：', error);
            loginError.textContent = '登入失敗，請聯繫客服';
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