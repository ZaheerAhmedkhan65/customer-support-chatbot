(function () {
    const toastTypes = {
        success: { style: 'success', icon: 'check-circle-fill' },
        error: { style: 'danger', icon: 'exclamation-triangle-fill' },
        warning: { style: 'warning', icon: 'exclamation-circle-fill' },
        info: { style: 'primary', icon: 'info-circle-fill' }
    };

    function showNotification(message, type = 'info') {
        const notification = toastTypes[type] || toastTypes.info;
        let container = document.getElementById('appToastContainer');

        if (!container) {
            container = document.createElement('div');
            container.id = 'appToastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${notification.style} border-0 shadow`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        toast.setAttribute('aria-atomic', 'true');

        const row = document.createElement('div');
        row.className = 'd-flex';

        const body = document.createElement('div');
        body.className = 'toast-body';

        const icon = document.createElement('i');
        icon.className = `bi bi-${notification.icon} me-2`;
        icon.setAttribute('aria-hidden', 'true');
        body.append(icon, document.createTextNode(String(message)));

        const close = document.createElement('button');
        close.type = 'button';
        close.className = `btn-close ${notification.style === 'warning' ? '' : 'btn-close-white'} me-2 m-auto`;
        close.setAttribute('data-bs-dismiss', 'toast');
        close.setAttribute('aria-label', 'Close');

        row.append(body, close);
        toast.appendChild(row);
        container.appendChild(toast);

        const toastInstance = window.bootstrap.Toast.getOrCreateInstance(toast, {
            animation: false,
            delay: 2500
        });
        toast.addEventListener('hidden.bs.toast', () => toast.remove(), { once: true });
        toastInstance.show();
        return toastInstance;
    }

    const modalElement = document.getElementById('appConfirmModal');
    const confirmButton = document.getElementById('appConfirmButton');
    const titleElement = document.getElementById('appConfirmTitle');
    const messageElement = document.getElementById('appConfirmMessage');
    let resolveConfirmation = null;

    function finishConfirmation(confirmed) {
        if (!resolveConfirmation) return;
        const resolve = resolveConfirmation;
        resolveConfirmation = null;
        resolve(confirmed);
    }

    async function showConfirm(message, options = {}) {
        if (!modalElement || !confirmButton || !titleElement || !messageElement || !window.bootstrap?.Modal) {
            throw new Error('The confirmation dialog is not available on this page.');
        }
        if (resolveConfirmation) {
            throw new Error('A confirmation dialog is already open.');
        }

        titleElement.textContent = options.title || 'Please confirm';
        messageElement.textContent = String(message);
        confirmButton.textContent = options.confirmText || 'Continue';
        const variant = ['primary', 'danger', 'warning'].includes(options.variant)
            ? options.variant
            : 'primary';
        confirmButton.className = `btn btn-${variant}`;

        const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
        return new Promise((resolve) => {
            resolveConfirmation = resolve;
            modalElement.addEventListener('hidden.bs.modal', () => finishConfirmation(false), { once: true });
            modal.show();
        });
    }

    function showPageNotifications() {
        document.querySelectorAll('[data-app-notification]').forEach((element) => {
            const message = element.textContent.trim();
            if (message) {
                showNotification(message, element.dataset.appNotificationType || 'info');
            }
            element.remove();
        });
    }

    confirmButton?.addEventListener('click', () => {
        finishConfirmation(true);
        window.bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showPageNotifications, { once: true });
    } else {
        showPageNotifications();
    }
    document.addEventListener('spa:pageinit', showPageNotifications);

    document.addEventListener('click', async (event) => {
        const link = event.target.closest('[data-confirm-message]');
        if (!link) return;

        event.preventDefault();
        try {
            if (await showConfirm(link.dataset.confirmMessage, {
                title: link.dataset.confirmTitle || 'Please confirm',
                confirmText: link.dataset.confirmButton || 'Continue',
                variant: link.dataset.confirmVariant || 'primary'
            })) {
                window.location.assign(link.href);
            }
        } catch (error) {
            console.error('Unable to show confirmation dialog:', error);
            showNotification('Unable to open the confirmation dialog.', 'error');
        }
    });

    window.showNotification = showNotification;
    window.showConfirm = showConfirm;
})();
