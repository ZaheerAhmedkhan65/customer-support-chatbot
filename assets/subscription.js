// Upgrade plan function
function upgradePlan(planId) {
    if (!confirm(`Are you sure you want to upgrade to the ${planId === 'professional' ? 'Professional' : 'Enterprise'} plan?`)) {
        return;
    }

    fetch('/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = '/dashboard?tab=billing';
            } else {
                alert('Failed to upgrade plan: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            alert('Error: ' + err.message);
        });
}

//Load subscription plans
function loadSubscriptionPlans() {
    fetch('/subscription/plans')
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

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const path = window.location.pathname;

    if (tab === 'billing' || path === '/') {
        loadSubscriptionPlans();
        attachBillingEventListeners();
    }
});

// Attach event listeners for billing buttons
function attachBillingEventListeners() {
    document.getElementById('subscriptionPlans')?.addEventListener('click', function (e) {
        const btn = e.target.closest('.upgrade-plan-btn');
        if (!btn) return;

        const planId = btn.getAttribute('data-plan');

        if (!planId) {
            alert('No plan selected. Please try again.');
            return;
        }

        upgradePlan(planId);
    });
}

window.upgradePlan = upgradePlan;