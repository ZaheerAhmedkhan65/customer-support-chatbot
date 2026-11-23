// Upgrade plan function
async function upgradePlan(planId) {
    if (!await window.showConfirm(
        `Are you sure you want to upgrade to the ${planId === 'professional' ? 'Professional' : 'Enterprise'} plan?`,
        { title: 'Upgrade plan', confirmText: 'Upgrade', variant: 'primary' }
    )) return;

    fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.showNotification(data.message, 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard?tab=billing';
                }, 2700);
            } else {
                window.showNotification('Failed to upgrade plan: ' + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(err => {
            window.showNotification('Error: ' + err.message, 'error');
        });
}

//Load subscription plans
function loadSubscriptionPlans() {
    fetch('/api/subscription/plans')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.plans) {
                displaySubscriptionPlans(data.plans);
            }
        })
        .catch(err => {
            console.error('Failed to load subscription plans:', err);
        });
}

//display Subscription Plans
function displaySubscriptionPlans(plans) {
    const container = document.getElementById('subscriptionPlans');
    container.innerHTML = '';

    plans.forEach((plan, index) => {
        const planCard = document.createElement('div');
        planCard.className = 'col-md-4 animate__animated animate__fadeInUp';
        planCard.style = `animation-delay: ${index * 0.1}s;`;

        // Convert limits object into list items
        const features = plan.features.map(feature => `<li class="mb-2">✓ ${feature}</li>`).join('');

        planCard.innerHTML = `
            <div class="card h-100 shadow-sm border-0 text-center p-4 hover-lift">
                <div class="card-body">
                    <h3 class="card-title h4">${plan.name}</h3>
                    <div class="display-4 fw-bold my-3">
                        ${plan.price === null ? 'Custom' : plan.currency + plan.price}
                        ${plan.price === null ? '' : `
                        <span class="fs-5 text-muted fw-normal">/${plan.billingPeriod}</span>
                        `}
                    </div>

                    <ul class="list-unstyled text-start mx-auto" style="max-width: 225px;">
                        ${features}
                    </ul>

                    <button class="btn btn-primary mt-auto mx-auto upgrade-plan-btn" ${plan.isCurrent ? 'disabled' : plan.price === 0 ? 'disabled' : ''} data-plan="${plan.id}">
                        ${plan.isCurrent ? 'Current Plan' : plan.price === 0 ? 'Free' : 'Upgrade'}
                    </button>
                </div>
            </div>
        `;

        container.appendChild(planCard);
    });
}

// Handle initial page load
document.addEventListener('DOMContentLoaded', function () {
    handleSubscriptionNavigation();
});

// Handle SPA navigation
document.addEventListener('spa:pageinit', function () {
    handleSubscriptionNavigation();
});

// Handle subscription-related navigation
function handleSubscriptionNavigation() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const path = window.location.pathname;

    if (tab === 'billing' || path === '/') {
        loadSubscriptionPlans();
    }
}

// Use event delegation on document level for upgrade buttons
// This ensures it works even after SPA navigation
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.upgrade-plan-btn');
    if (!btn) return;

    const planId = btn.getAttribute('data-plan');

    if (!planId) {
        window.showNotification('No plan selected. Please try again.', 'warning');
        return;
    }

    upgradePlan(planId);
});

window.upgradePlan = upgradePlan;