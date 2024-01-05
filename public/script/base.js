const logo = document.querySelector('.header-title');
const signup = document.querySelector('.header-nav_signup');
const login = document.querySelector('.header-nav_login');

logo.addEventListener('click', () => {
    window.location.href = '/';
});

signup.addEventListener('click', () => {
    window.location.href = '/signup';
});

login.addEventListener('click', () => {
    window.location.href = '/login';
});