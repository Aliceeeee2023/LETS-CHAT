const signupButton = document.querySelector('.signup-button');
const loginLinkSpan = document.querySelector('.login-link-span');
const signupError = document.querySelector('.signup-error');

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

// 進入頁面時重置錯誤訊息狀態
document.addEventListener('DOMContentLoaded', () => {
    signupError.style.display = 'none';
});

// 將資料送至後端處理
async function submitSignupForm() {
    let emailInput = document.querySelector('.signup-email');
    let passwordInput = document.querySelector('.signup-password');
    let email = emailInput.value;
    let password = passwordInput.value;

    signupError.style.display = 'block';

    // 檢查資料後無誤送到後端
    if (!email || !password) {
        signupError.textContent = '註冊資料不可為空';
    } else if (!checkEmail(email)) {
        signupError.textContent = '無效的電子郵件格式';
    } else if (!checkPassword(password)) {
        signupError.textContent = '無效的密碼格式';
    } else {
        // 將表單資料清空
        emailInput.value = '';
        passwordInput.value = '';
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify({ email, password }), // 名稱作為屬性名，值作為相應屬性的值
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