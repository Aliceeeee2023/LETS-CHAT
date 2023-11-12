const logo = document.querySelector('.header-title');
const login = document.querySelector('.header-nav_login');

// 跳轉至根目錄、登入畫面
logo.addEventListener('click', () => {
    window.location.href = '/';
});

login.addEventListener('click', () => {
    window.location.href = '/login';
});