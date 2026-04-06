function initializePasswordToggle() {

    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (!toggleBtn || !passwordInput) return;

    toggleBtn.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });

}