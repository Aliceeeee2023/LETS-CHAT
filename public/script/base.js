const logo = document.querySelector('.header-title');
const login = document.querySelector('.header-nav_login');

logo.addEventListener('click', () => {
    window.location.href = 'index.html';
});

login.addEventListener('click', () => {
    window.location.href = 'login.html';
});