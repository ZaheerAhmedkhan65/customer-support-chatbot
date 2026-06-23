// assets/dashboard.js
// This file contains dashboard functionality that works with SPA navigation
// Event listeners are attached via the SPA page initialization in assets/js/pages/dashboard.js

// Dashboard JavaScript - Knowledge Base Management

function copyEmbedCode() {
    const code = document.getElementById('embedCode')?.textContent;
    if (!code) return;
    navigator.clipboard.writeText(code);
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.remove('btn-outline-light');
        copyBtn.classList.add('btn-success');
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('btn-success');
            copyBtn.classList.add('btn-outline-light');
        }, 1200);
    }
}

// Note: Event listeners are now attached via SPA page initialization
// The functions below are called from assets/js/pages/dashboard.js

// ============================================
// Website Crawler Functions
// ============================================

let crawledEntries = [];

// Crawl website and extract knowledge entries
function crawlWebsite() {
    const url = document.getElementById('crawlUrl').value.trim();
    if (!url) {
        alert('Please enter a website URL.');
        return;
    }

    // Show progress
    document.getElementById('crawlProgress').classList.remove('d-none');
    document.getElementById('crawlResults').classList.add('d-none');
    document.getElementById('crawlError').classList.add('d-none');
    document.getElementById('crawlBtn').disabled = true;
    document.getElementById('crawlStatus').textContent = 'Crawling website...';
    document.getElementById('crawlProgressBar').style.width = '30%';

    fetch('/api/chatbot/crawl-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('crawlBtn').disabled = false;
        document.getElementById('crawlProgress').classList.add('d-none');

        if (data.success && data.entries && data.entries.length > 0) {
            crawledEntries = data.entries;
            displayCrawledEntries(data.entries);
        } else if (data.success) {
            document.getElementById('crawlError').textContent = data.message || 'No useful content found on this website. Try a different URL.';
            document.getElementById('crawlError').classList.remove('d-none');
        } else {
            document.getElementById('crawlError').textContent = data.error || 'Failed to crawl website.';
            document.getElementById('crawlError').classList.remove('d-none');
        }
    })
    .catch(err => {
        document.getElementById('crawlBtn').disabled = false;
        document.getElementById('crawlProgress').classList.add('d-none');
        document.getElementById('crawlError').textContent = 'Error: ' + err.message;
        document.getElementById('crawlError').classList.remove('d-none');
    });
}

// Display crawled entries in the results area
function displayCrawledEntries(entries) {
    const list = document.getElementById('crawlEntriesList');
    let html = '';

    entries.forEach((entry, index) => {
        const preview = (entry.answer || '').substring(0, 150);
        html += `
            <div class="card mb-2 border">
                <div class="card-body py-2 px-3">
                    <div class="form-check">
                        <input class="form-check-input crawl-entry-checkbox" type="checkbox" value="" id="crawl-entry-${index}" checked>
                        <label class="form-check-label d-flex flex-column" for="crawl-entry-${index}">
                            <span class="badge bg-secondary align-self-start mb-1">${(entry.content_type || 'general').toUpperCase()}</span>
                            <strong>${escapeHtml(entry.question || 'Untitled')}</strong>
                            <small class="text-muted">${escapeHtml(preview)}${entry.answer && entry.answer.length > 150 ? '...' : ''}</small>
                            <small class="text-muted mt-1"><i class="bi bi-tags"></i> ${escapeHtml(entry.keywords || '')}</small>
                        </label>
                    </div>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;

    // Enable import button when at least one checkbox is checked
    const checkboxes = list.querySelectorAll('.crawl-entry-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const anyChecked = list.querySelectorAll('.crawl-entry-checkbox:checked').length > 0;
            document.getElementById('importCrawledBtn').disabled = !anyChecked;
        });
    });

    document.getElementById('crawlResults').classList.remove('d-none');
    document.getElementById('importCrawledBtn').disabled = false;
}

// Import selected crawled entries to knowledge base
let isImporting = false;
function importCrawledEntries() {
    if (isImporting) return;
    const importBtn = document.getElementById('importCrawledBtn');
    if (!importBtn || importBtn.disabled) return;
    isImporting = true;

    const list = document.getElementById('crawlEntriesList');
    const selectedIndices = [];

    list.querySelectorAll('.crawl-entry-checkbox').forEach((cb, index) => {
        if (cb.checked) {
            selectedIndices.push(index);
        }
    });

    if (selectedIndices.length === 0) {
        alert('Please select at least one entry to import.');
        return;
    }

    importBtn.disabled = true;
    importBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Importing...';

    const selectedEntries = selectedIndices.map(i => ({
        content_type: crawledEntries[i].content_type,
        question: crawledEntries[i].question,
        answer: crawledEntries[i].answer,
        keywords: crawledEntries[i].keywords
    }));

    fetch('/api/chatbot/crawl-website/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: selectedEntries })
    })
    .then(response => response.json())
    .then(data => {
        importBtn.innerHTML = '<i class="bi bi-download"></i> Import Selected';

        if (data.success) {
            alert(data.message || `Successfully imported ${data.addedCount} entries!`);
            window.location.href = '/dashboard?tab=knowledge';
        } else {
            alert('Failed to import: ' + (data.error || 'Unknown error'));
            importBtn.disabled = false;
        }
    })
    .catch(err => {
        importBtn.innerHTML = '<i class="bi bi-download"></i> Import Selected';
        importBtn.disabled = false;
        alert('Error: ' + err.message);
    });
}

// ============================================
// Billing & Usage Tracking Functions
// ============================================

// Note: Tab-based initialization is now handled via SPA page initialization
// in assets/js/pages/dashboard.js

// ============================================
// Analytics Functions
// ============================================

let analyticsPage = 1;
let analyticsLoading = false;
let analyticsHasMore = true;

// Load analytics data
function loadAnalyticsData() {
    // Prevent duplicate calls while already loading
    if (analyticsLoading) {
        return;
    }

    // Reset pagination state for fresh data load
    analyticsPage = 1;
    analyticsHasMore = true;

    // Clear existing conversations container
    const container = document.getElementById('conversationsContainer');
    if (container) {
        container.innerHTML = '';
    }

    // Reset the "no conversations" and "no more data" indicators
    const noConversations = document.getElementById('noConversations');
    const noMoreData = document.getElementById('noMoreData');
    if (noConversations) noConversations.style.display = 'none';
    if (noMoreData) noMoreData.style.display = 'none';

    // Load summary stats
    fetchAnalyticsSummary();

    // Load chart data
    fetchChartData();

    // Load initial conversations (loadMoreConversations will set analyticsLoading = true)
    loadMoreConversations();
}

// Fetch analytics summary
function fetchAnalyticsSummary() {
    fetch('/api/chatbot/analytics/summary')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('totalConversations').textContent = data.summary.totalConversations || 0;
                document.getElementById('totalSessions').textContent = data.summary.totalSessions || 0;
                document.getElementById('todayConversations').textContent = data.summary.todayConversations || 0;
                document.getElementById('avgMessagesPerSession').textContent = data.summary.avgMessagesPerSession || 0;
            }
        })
        .catch(err => console.error('Failed to load analytics summary:', err));
}

// Fetch chart data
function fetchChartData() {
    fetch('/api/chatbot/analytics/chart-data')
        .then(response => response.json())
        .then(data => {
            console.log('Chart data received:', data);
            if (data.success) {
                renderChart(data.labels, data.data);
            } else {
                console.error('Chart data error:', data);
            }
        })
        .catch(err => console.error('Failed to load chart data:', err));
}

// Store chart instance to destroy before re-rendering
let conversationChartInstance = null;

// Render conversation chart
function renderChart(labels, data) {
    const ctx = document.getElementById('conversationChart');
    if (!ctx) return;

    // Destroy existing chart instance before creating a new one
    if (conversationChartInstance) {
        conversationChartInstance.destroy();
        conversationChartInstance = null;
    }

    conversationChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Conversations',
                data: data,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Load more conversations with infinite scroll
function loadMoreConversations() {
    if (analyticsLoading || !analyticsHasMore) return;

    analyticsLoading = true;
    document.getElementById('loadingIndicator').style.display = 'block';

    fetch(`/api/chatbot/analytics/conversations?page=${analyticsPage}&limit=50`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('loadingIndicator').style.display = 'none';
            analyticsLoading = false;

            if (data.success && data.conversations.length > 0) {
                // Hide "no conversations" message
                document.getElementById('noConversations').style.display = 'none';

                // Group conversations by session_id
                const grouped = groupBySession(data.conversations);

                // Render grouped conversations
                renderGroupedConversations(grouped);

                analyticsPage++;

                if (data.conversations.length < 50) {
                    analyticsHasMore = false;
                    document.getElementById('noMoreData').style.display = 'block';
                }
            } else if (analyticsPage === 1) {
                // No conversations at all
                document.getElementById('noConversations').style.display = 'block';
                analyticsHasMore = false;
            }
        })
        .catch(err => {
            console.error('Failed to load conversations:', err);
            analyticsLoading = false;
            document.getElementById('loadingIndicator').style.display = 'none';
        });
}

// Group conversations by session_id
function groupBySession(conversations) {
    const groups = {};
    conversations.forEach(conv => {
        if (!groups[conv.session_id]) {
            groups[conv.session_id] = {
                session_id: conv.session_id,
                messages: [],
                firstMessage: conv.created_at
            };
        }
        groups[conv.session_id].messages.push({
            user_message: conv.user_message,
            bot_response: conv.bot_response,
            created_at: conv.created_at
        });
    });
    return groups;
}

// Render grouped conversations as accordions
function renderGroupedConversations(grouped) {
    const container = document.getElementById('conversationsContainer');

    Object.values(grouped).forEach((session, index) => {
        const messageCount = session.messages.length;
        const firstMessageTime = new Date(session.firstMessage).toLocaleString();
      
        const accordion = document.createElement('div');
        accordion.className = 'accordion-item mb-3 border shadow-sm';
        accordion.style.borderRadius = '8px';
        accordion.style.overflow = 'hidden';
        accordion.innerHTML = `
            <h2 class="accordion-header" id="session-${session.session_id}" style="margin: 0;">
                <button class="accordion-button collapsed p-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${session.session_id}" aria-expanded="false" aria-controls="collapse-${session.session_id}" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); transition: all 0.3s ease;">
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <div class="d-flex align-items-center" style="flex: 1; min-width: 0;">
                            <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; flex-shrink: 0;">
                                <i class="bi bi-chat-square-text text-white" style="font-size: 0.9rem;"></i>
                            </div>
                            <div style="min-width: 0; flex: 1;">
                                <div class="d-flex align-items-start justify-content-between">
                                    <div class="text-truncate mb-1" style="font-weight: 600; color: #2c3e50;">
                                        <span class="text-truncate" style="font-size: 1.2rem;">${messageCount} message${messageCount > 1 ? 's' : ''}</span>
                                    </div>
                                    <small class="text-muted" style="font-size: 0.75rem;">${firstMessageTime}</small>
                                </div>
                            </div>
                        </div>
                        <div class="ms-2 flex-shrink-0">
                            <i class="bi bi-chevron-down text-muted" style="transition: transform 0.3s ease; font-size: 0.8rem;"></i>
                        </div>
                    </div>
                </button>
            </h2>
            <div id="collapse-${session.session_id}" class="accordion-collapse collapse" aria-labelledby="session-${session.session_id}" data-bs-parent="#conversationsContainer">
                <div class="accordion-body" style="background: #fafbfc; padding: 1.25rem;">
                    <div class="conversation-messages">
                        ${session.messages.map((msg, msgIndex) => `
                            <div class="mb-3" style="padding: 0.75rem; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                                <div class="d-flex align-items-start mb-2">
                                    <div class="flex-grow-1 d-flex align-items-start justify-content-between">
                                        <p class="mb-1" style="line-height: 1.5; font-weight: 600; font-size: 1rem;">${escapeHtml(msg.user_message)}</p>
                                        <small class="text-muted" style="font-size: 0.7rem;">${new Date(msg.created_at).toLocaleString()}</small>
                                    </div>
                                </div>
                                <div class="d-flex align-items-start mt-2">
                                    <div class="flex-grow-1">
                                        <p class="mb-1" style="line-height: 1.5; color: #374151;">${escapeHtml(msg.bot_response)}</p>
                                    </div>
                                </div>
                            </div>
                            ${msgIndex < session.messages.length - 1 ? '' : ''}
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Add hover effect
        const button = accordion.querySelector('.accordion-button');
        button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
        });

        // Rotate chevron when expanded
        const chevron = accordion.querySelector('.bi-chevron-down');
        const collapseEl = accordion.querySelector('.accordion-collapse');
        collapseEl.addEventListener('shown.bs.collapse', () => {
            chevron.style.transform = 'rotate(180deg)';
        });
        collapseEl.addEventListener('hidden.bs.collapse', () => {
            chevron.style.transform = 'rotate(0deg)';
        });

        container.appendChild(accordion);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Store scroll handler reference to prevent duplicate listeners
let infiniteScrollHandler = null;

// Setup infinite scroll
function setupInfiniteScroll() {
    const scrollContainer = window;

    // Remove existing listener if present to prevent duplicates
    if (infiniteScrollHandler) {
        scrollContainer.removeEventListener('scroll', infiniteScrollHandler);
        infiniteScrollHandler = null;
    }

    // Create and attach new scroll handler
    infiniteScrollHandler = () => {
        const scrollTop = scrollContainer.scrollY || scrollContainer.scrollTop;
        const windowHeight = scrollContainer.innerHeight || document.documentElement.clientHeight;
        const documentHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

        if (scrollTop + windowHeight >= documentHeight - 200) {
            loadMoreConversations();
        }
    };

    scrollContainer.addEventListener('scroll', infiniteScrollHandler);
}

// Attach event listeners for billing buttons
function attachBillingEventListeners() {
    const cancelBtn = document.getElementById('cancelBtn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            cancelSubscription();
        });
    }
}

// Load usage and subscription data
function loadUsageData() {
    fetch('/subscription/usage')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.usage) {
                updateUsageDisplay(data.usage);
            }
        })
        .catch(err => {
            console.error('Failed to load usage data:', err);
            document.getElementById('conversationBadge').textContent = 'Error';
            document.getElementById('kbBadge').textContent = 'Error';
        });
}

// Update the usage display with data
function updateUsageDisplay(usage) {
    // Update conversation usage
    const convUsed = usage.usage.conversations;
    const convLimit = usage.limits.conversations;
    const convPercentage = usage.percentageUsed;

    const convBadge = document.getElementById('conversationBadge');
    const convProgress = document.getElementById('conversationProgress');
    const convDetails = document.getElementById('conversationDetails');

    if (convBadge && convProgress && convDetails) {
        const limitText = convLimit === -1 ? 'Unlimited' : convLimit.toLocaleString();
        convBadge.textContent = `${convUsed.toLocaleString()} / ${limitText}`;
        convProgress.style.width = convPercentage > 100 ? '100%' : convPercentage + '%';

        if (convPercentage >= 90) {
            convProgress.classList.remove('bg-primary');
            convProgress.classList.add('bg-danger');
            convBadge.classList.remove('bg-primary');
            convBadge.classList.add('bg-danger');
        } else if (convPercentage >= 70) {
            convProgress.classList.remove('bg-primary');
            convProgress.classList.add('bg-warning');
            convBadge.classList.remove('bg-primary');
            convBadge.classList.add('bg-warning');
        }

        convDetails.textContent = `${convUsed.toLocaleString()} of ${limitText} conversations used`;
    }

    // Update knowledge base usage
    const kbUsed = usage.usage.knowledgeBase;
    const kbLimit = usage.limits.knowledgeBase;
    const kbPercentage = kbLimit > 0 ? Math.round((kbUsed / kbLimit) * 100) : 0;

    const kbBadge = document.getElementById('kbBadge');
    const kbProgress = document.getElementById('kbProgress');
    const kbDetails = document.getElementById('kbDetails');

    if (kbBadge && kbProgress && kbDetails) {
        const kbLimitText = kbLimit === -1 ? 'Unlimited' : kbLimit.toLocaleString();
        kbBadge.textContent = `${kbUsed} / ${kbLimitText}`;
        kbProgress.style.width = kbPercentage > 100 ? '100%' : kbPercentage + '%';
        kbDetails.textContent = `${kbUsed} of ${kbLimitText} items`;
    }

    // Update current plan display
    const planName = document.getElementById('currentPlanName');
    const planPrice = document.getElementById('currentPlanPrice');
    const planInitial = document.getElementById('planInitial');

    if (planName && planPrice) {
        planName.textContent = usage.subscription.planName;
        planPrice.textContent = usage.subscription.price ? `$${usage.subscription.price}/month` : 'Free';

        if (planInitial) {
            planInitial.textContent = usage.subscription.planName.charAt(0).toUpperCase();
        }
    }
}

// Contact sales function
function contactSales() {
    window.location.href = '/pages/contact';
}

// Cancel subscription function
function cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will be downgraded to the free Starter plan at the end of your current billing period.')) {
        return;
    }

    // Second confirmation
    if (!confirm('This action cannot be undone. Your chatbot will have limited features (1,000 conversations/month). Do you still want to cancel?')) {
        return;
    }

    fetch('/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = '/dashboard?tab=billing';
            } else {
                alert('Failed to cancel subscription: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            alert('Error: ' + err.message);
        });
}

// Update plan display based on current plan
function updatePlanDisplay(planId) {
    const currentPlanBtn = document.getElementById('currentPlanBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (planId === 'free') {
        if (currentPlanBtn) {
            currentPlanBtn.textContent = 'Current';
            currentPlanBtn.disabled = true;
            currentPlanBtn.classList.remove('btn-primary', 'btn-outline-primary');
            currentPlanBtn.classList.add('btn-outline-secondary');
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
    } else if (planId === 'professional') {
        if (currentPlanBtn) {
            currentPlanBtn.textContent = 'Downgrade';
            currentPlanBtn.disabled = false;
            currentPlanBtn.classList.remove('btn-outline-secondary');
            currentPlanBtn.classList.add('btn-outline-primary');
            currentPlanBtn.onclick = function () { downgradePlan('free'); };
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
        }
    } else if (planId === 'enterprise') {
        if (currentPlanBtn) {
            currentPlanBtn.textContent = 'Downgrade';
            currentPlanBtn.disabled = false;
            currentPlanBtn.classList.remove('btn-outline-secondary');
            currentPlanBtn.classList.add('btn-outline-primary');
            currentPlanBtn.onclick = function () { downgradePlan('professional'); };
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
        }
    }
}

// Downgrade plan function
function downgradePlan(planId) {
    if (!confirm(`Are you sure you want to downgrade to the ${planId === 'free' ? 'Starter (Free)' : planId === 'professional' ? 'Professional ($7/mo)' : 'Enterprise'} plan?`)) {
        return;
    }

    fetch('/subscription/downgrade', {
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
                alert('Failed to downgrade plan: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            alert('Error: ' + err.message);
        });
}

// Make functions globally available
window.contactSales = contactSales;
window.cancelSubscription = cancelSubscription;
window.downgradePlan = downgradePlan;
