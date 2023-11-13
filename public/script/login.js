const loginButton = document.querySelector('.login-button');
const signupLinkSpan = document.querySelector('.signup-link-span');

loginButton.addEventListener('click', () => {
    window.location.href = '/chat';
});
signupLinkSpan.addEventListener('click', () => {
    window.location.href = '/signup';
});