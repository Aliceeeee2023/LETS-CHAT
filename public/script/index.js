const chat = document.querySelector('.header-nav_chat');
const logout = document.querySelector('.header-nav_logout');
const start = document.querySelector('.main-container_start');
const token = localStorage.getItem('token');

chat.addEventListener('click', () => {
    window.location.href = '/chat';
});

start.addEventListener('click', () => {
    window.location.href = '/login';
});

logout.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.reload();
});

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.display = 'none';
    
    checkUsers(token);
});

async function checkUsers(token) {
    try {
        let response = await fetch('/api/login', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        if (response.status === 200) {
            login.textContent = '';
            signup.textContent = '';

            chat.style.display = 'block';
            logout.style.display = 'block';

            document.body.style.display = 'block';
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