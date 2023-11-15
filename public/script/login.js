const loginButton = document.querySelector('.login-button');
const signupLinkSpan = document.querySelector('.signup-link-span');
const loginError = document.querySelector('.login-error');

// 點擊後跳轉至註冊頁面
signupLinkSpan.addEventListener('click', () => {
    window.location.href = '/signup';
});

loginButton.addEventListener('click', () => {
    submitloginForm();
});

// 進入頁面時重置錯誤訊息狀態
document.addEventListener('DOMContentLoaded', () => {
    loginError.style.display = 'none';
});

// 將登入資料送至後端處理
async function submitloginForm() {
    let emailInput = document.querySelector('.login-email');
    let passwordInput = document.querySelector('.login-password');
    let email = emailInput.value;
    let password = passwordInput.value;

    loginError.style.display = 'block';

    // 檢查資料後無誤送到後端
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
                // 將 token 放到 localStorage
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

// 進入頁面當下判斷是否有登入（跟 Signup 判斷完全相同）
const token = localStorage.getItem("token");

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.display = 'none';
    checkUsers(token);
});

async function checkUsers(token) {
    try {
        let response = await fetch("/api/login", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
        });

        if (response.status === 200) {
            window.location.href = '/chat';
        } else if (response.status === 400) {
            document.body.style.display = 'block';
            console.error('未登入帳號');
        } else {
            document.body.style.display = 'block';
            console.error('伺服器內部錯誤');
        };
    } catch (error) {
        console.error('錯誤：', error);
    };
};