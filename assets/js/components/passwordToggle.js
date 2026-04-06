SPA.registerComponent(

    function () {

        // Use event delegation to handle password toggle
        // This ensures it works even after SPA navigation
        document.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-toggle-password]');
            if (!btn) return;

            const targetSelector = btn.dataset.target || '#password';
            const input = document.querySelector(targetSelector);

            if (!input) return;

            input.type =
                input.type === "password"
                    ? "text"
                    : "password";

            // Toggle eye icon
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('bi-eye');
                icon.classList.toggle('bi-eye-slash');
            }
        });

    }
);
