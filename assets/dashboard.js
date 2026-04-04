//assets/dashboard.js
const addToKnowledgeBaseBtn = document.getElementById('addToKnowledgeBaseBtn');
if (addToKnowledgeBaseBtn) {
    addToKnowledgeBaseBtn.addEventListener('click', addGeneratedContent);
}

const extractKeywordBtn = document.getElementById('extractKeywordBtn');
if (extractKeywordBtn) {
    extractKeywordBtn.addEventListener('click', extractKeywords);
}

const generateAnswerBtn = document.getElementById('generateAnswerBtn');
if (generateAnswerBtn) {
    generateAnswerBtn.addEventListener('click', generateAnswer);
}

const generateFaqBtn = document.getElementById('generateFaqBtn');
if (generateFaqBtn) {
    generateFaqBtn.addEventListener('click', generateFAQs);
}
// Copy embed code functionality
const copyBtn = document.getElementById('copyBtn');
if (copyBtn) {
    copyBtn.addEventListener('click', copyEmbedCode);
}
// Dashboard JavaScript - Knowledge Base Management

function copyEmbedCode() {
    const code = document.getElementById('embedCode').textContent;
    navigator.clipboard.writeText(code);
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.remove('btn-outline-light');
    copyBtn.classList.add('btn-success');
    setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('btn-success');
        copyBtn.classList.add('btn-outline-light');
    }, 1200);
}

// Auto-generate keywords from answer text
document.getElementById('autoGenerateKeywords')?.addEventListener('click', function () {
    const answer = document.getElementById('answer').value;
    if (!answer.trim()) {
        alert('Please enter an answer first to generate keywords.');
        return;
    }

    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'been', 'being', 'do', 'does', 'did', 'doing', 'would', 'should', 'could', 'will', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'having'];

    const words = answer.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));

    const uniqueWords = [...new Set(words)].slice(0, 10);
    document.getElementById('keywords').value = uniqueWords.join(', ');
});

// Open edit modal with item data using event delegation
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const contentType = this.getAttribute('data-type');
            const question = this.getAttribute('data-question');
            const answer = this.getAttribute('data-answer');
            const keywords = this.getAttribute('data-keywords');

            document.getElementById('editId').value = id;
            document.getElementById('edit_content_type').value = contentType;
            document.getElementById('edit_question').value = question;
            document.getElementById('edit_answer').value = answer;
            document.getElementById('edit_keywords').value = keywords;

            // Update form action
            document.getElementById('editForm').action = '/api/chatbot/knowledge/' + id + '?_method=PUT';

            // Show modal
            const editModal = new bootstrap.Modal(document.getElementById('editModal'));
            editModal.show();
        });
    });
});

// Event listeners for action buttons
document.getElementById('importJsonBtn')?.addEventListener('click', importJSON);
document.getElementById('generateFaqBtn')?.addEventListener('click', generateFAQs);
document.getElementById('generateAnswerBtn')?.addEventListener('click', generateAnswer);
document.getElementById('extractKeywordBtn')?.addEventListener('click', extractKeywords);
document.getElementById('addToKnowledgeBaseBtn')?.addEventListener('click', addGeneratedContent);

// Import JSON data
function importJSON() {
    const fileInput = document.getElementById('jsonFile');
    const textArea = document.getElementById('jsonData');
    let entries = null;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                entries = JSON.parse(e.target.result);
                processImport(entries);
            } catch (err) {
                alert('Invalid JSON file. Please check the format.');
            }
        };
        reader.readAsText(file);
    } else if (textArea.value.trim()) {
        try {
            entries = JSON.parse(textArea.value);
            processImport(entries);
        } catch (err) {
            alert('Invalid JSON data. Please check the format.');
        }
    } else {
        alert('Please upload a JSON file or paste JSON data.');
    }
}

function processImport(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
        alert('No valid entries found in the JSON data.');
        return;
    }

    const validEntries = entries.filter(entry => entry.question && entry.answer);

    if (validEntries.length === 0) {
        alert('No valid entries found. Each entry must have at least a question and answer.');
        return;
    }

    fetch('/api/chatbot/knowledge/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: validEntries })
    }).then(response => {
        if (response.ok) {
            // Use href assignment instead of reload() to avoid SSL protocol errors
            window.location.href = '/dashboard?tab=knowledge';
        } else {
            alert('Failed to import entries. Please try again.');
        }
    }).catch(err => {
        alert('Error: ' + err.message);
    });
}

// AI Generation functions
let generatedData = null;

function generateFAQs() {
    const description = document.getElementById('businessDescription').value.trim();
    if (!description) {
        alert('Please describe your business first.');
        return;
    }

    document.getElementById('generateFaqSpinner').classList.remove('d-none');

    fetch('/api/chatbot/knowledge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: description, type: 'faq' })
    }).then(response => response.json())
        .then(data => {
            document.getElementById('generateFaqSpinner').classList.add('d-none');
            displayGeneratedContent(data.result);
        })
        .catch(err => {
            document.getElementById('generateFaqSpinner').classList.add('d-none');
            alert('Failed to generate FAQs: ' + err.message);
        });
}

function generateAnswer() {
    const question = document.getElementById('answerQuestion').value.trim();
    if (!question) {
        alert('Please enter a question first.');
        return;
    }

    document.getElementById('generateAnswerSpinner').classList.remove('d-none');

    fetch('/api/chatbot/knowledge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question, type: 'answer' })
    }).then(response => response.json())
        .then(data => {
            document.getElementById('generateAnswerSpinner').classList.add('d-none');
            displayGeneratedContent(data.result);
        })
        .catch(err => {
            document.getElementById('generateAnswerSpinner').classList.add('d-none');
            alert('Failed to generate answer: ' + err.message);
        });
}

function extractKeywords() {
    const text = document.getElementById('keywordText').value.trim();
    if (!text) {
        alert('Please enter text to extract keywords from.');
        return;
    }

    document.getElementById('generateKeywordsSpinner').classList.remove('d-none');

    fetch('/api/chatbot/knowledge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, type: 'keywords' })
    }).then(response => response.json())
        .then(data => {
            document.getElementById('generateKeywordsSpinner').classList.add('d-none');
            displayGeneratedContent(data.result);
        })
        .catch(err => {
            document.getElementById('generateKeywordsSpinner').classList.add('d-none');
            alert('Failed to extract keywords: ' + err.message);
        });
}

function displayGeneratedContent(content) {
    generatedData = content;
    const previewDiv = document.getElementById('generatedPreview');

    try {
        if (typeof content === 'string') {
            let cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanContent);

            if (Array.isArray(parsed)) {
                let html = '<div class="mb-3"><strong>Generated ' + parsed.length + ' entries:</strong></div>';
                parsed.forEach((item, index) => {
                    html += '<div class="card mb-2"><div class="card-body p-2">';
                    html += '<strong>' + (index + 1) + '.</strong> ';
                    if (item.question) html += '<strong>Q:</strong> ' + item.question + '<br>';
                    if (item.answer) html += '<strong>A:</strong> ' + item.answer.substring(0, 100) + '...<br>';
                    if (item.keywords) html += '<small class="text-muted">Keywords: ' + item.keywords + '</small>';
                    html += '</div></div>';
                });
                previewDiv.innerHTML = html;
            } else {
                previewDiv.innerHTML = '<pre>' + content + '</pre>';
            }
        } else {
            previewDiv.innerHTML = '<p>' + content + '</p>';
        }
    } catch (e) {
        previewDiv.innerHTML = '<pre>' + content + '</pre>';
    }

    document.getElementById('generatedContent').classList.remove('d-none');
}

function addGeneratedContent() {
    if (!generatedData) return;

    try {
        let entries;
        if (typeof generatedData === 'string') {
            let cleanContent = generatedData.replace(/```json/g, '').replace(/```/g, '').trim();
            entries = JSON.parse(cleanContent);
        } else {
            entries = generatedData;
        }

        if (!Array.isArray(entries)) {
            entries = [{
                content_type: 'faq',
                question: 'Generated Question',
                answer: typeof generatedData === 'string' ? generatedData : JSON.stringify(generatedData),
                keywords: ''
            }];
        }

        fetch('/api/chatbot/knowledge/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: entries })
        }).then(response => {
            if (response.ok) {
                // Use href assignment instead of reload() to avoid SSL protocol errors
                window.location.href = '/dashboard?tab=knowledge';
            } else {
                alert('Failed to add generated content.');
            }
        }).catch(err => {
            alert('Error: ' + err.message);
        });
    } catch (e) {
        alert('Could not parse generated content. Please try again.');
    }
}

// Load templates when modal opens
document.getElementById('templatesModal')?.addEventListener('show.bs.modal', function () {
    loadTemplates();
});

function loadTemplates() {
    fetch('/api/chatbot/knowledge/templates')
        .then(response => response.json())
        .then(data => {
            const templatesList = document.getElementById('templatesList');
            if (data.templates && data.templates.length > 0) {
                let html = '';
                data.templates.forEach(template => {
                    html += '<div class="list-group-item">';
                    html += '<div class="d-flex w-100 justify-content-between align-items-center">';
                    html += '<div>';
                    html += '<h6 class="mb-1">' + template.name + '</h6>';
                    html += '<small class="text-muted">' + template.description + '</small>';
                    html += '<div class="mt-1"><span class="badge bg-secondary">' + template.category + '</span>';
                    html += '<span class="badge bg-info ms-1">' + template.entries.length + ' entries</span></div>';
                    html += '</div>';
                    html += '<form action="#" method="POST">';
                    html += '<input type="hidden" name="templateId" value="' + template.id + '">';
                    html += '<button type="submit" class="btn btn-sm btn-primary apply-template-btn">Add Template</button>';
                    html += '</form>';
                    html += '</div></div>';
                });
                templatesList.innerHTML = html;

                // Add event listeners to template buttons
                document.querySelectorAll('.apply-template-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        const form = this.closest('form');
                        const templateId = form.querySelector('input[name="templateId"]').value;

                        fetch('/api/chatbot/knowledge/apply-template', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ templateId: templateId })
                        }).then(response => {
                            if (response.ok) {
                                // Use href assignment instead of reload() to avoid SSL protocol errors
                                window.location.href = '/dashboard?tab=knowledge';
                            } else {
                                alert('Failed to apply template.');
                            }
                        }).catch(err => {
                            alert('Error: ' + err.message);
                        });
                    });
                });
            } else {
                templatesList.innerHTML = '<p class="text-muted text-center">No templates available.</p>';
            }
        })
        .catch(err => {
            document.getElementById('templatesList').innerHTML = '<p class="text-danger text-center">Failed to load templates.</p>';
        });
}

// ============================================
// Billing & Usage Tracking Functions
// ============================================

// Load data based on active tab
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');

    if (tab === 'billing') {
        loadSubscriptionPlans();
        loadUsageData();
        attachBillingEventListeners();
    } else if (tab === 'analytics') {
        loadAnalyticsData();
        setupInfiniteScroll();
    }
});

// ============================================
// Analytics Functions
// ============================================

let analyticsPage = 1;
let analyticsLoading = false;
let analyticsHasMore = true;

// Load analytics data
function loadAnalyticsData() {
    // Load summary stats
    fetchAnalyticsSummary();

    // Load chart data
    fetchChartData();

    // Load initial conversations
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

// Render conversation chart
function renderChart(labels, data) {
    const ctx = document.getElementById('conversationChart');
    if (!ctx) return;

    new Chart(ctx, {
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
        // Get the first customer message to display in the accordion header
        const firstMessage = session.messages[0] ? session.messages[0].user_message : 'No message';
        const truncatedMessage = firstMessage.length > 80 ? firstMessage.substring(0, 80) + '...' : firstMessage;

        const accordion = document.createElement('div');
        accordion.className = 'accordion-item mb-3 border shadow-sm';
        accordion.style.borderRadius = '8px';
        accordion.style.overflow = 'hidden';
        accordion.innerHTML = `
            <h2 class="accordion-header" id="session-${session.session_id}" style="margin: 0;">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${session.session_id}" aria-expanded="false" aria-controls="collapse-${session.session_id}" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); transition: all 0.3s ease;">
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <div class="d-flex align-items-center" style="flex: 1; min-width: 0;">
                            <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; flex-shrink: 0;">
                                <i class="bi bi-chat-square-text text-white" style="font-size: 0.9rem;"></i>
                            </div>
                            <div style="min-width: 0; flex: 1;">
                                <div class="text-truncate mb-1" style="font-weight: 600; color: #2c3e50;">
                                    "${escapeHtml(truncatedMessage)}"
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-primary me-2" style="font-size: 0.7rem;">${messageCount} msg${messageCount > 1 ? 's' : ''}</span>
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
                            <div class="mb-3" style="padding: 0.75rem; background: white; border-radius: 8px; border-left: 4px solid ${msgIndex === 0 ? '#3B82F6' : '#10B981'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                                <div class="d-flex align-items-start mb-2">
                                    <span class="badge ${msgIndex === 0 ? 'bg-primary' : 'bg-secondary'} me-2 mt-1" style="font-size: 0.7rem;">${msgIndex === 0 ? 'Customer' : 'Customer'}</span>
                                    <div class="flex-grow-1">
                                        <p class="mb-1" style="line-height: 1.5;">${escapeHtml(msg.user_message)}</p>
                                        <small class="text-muted" style="font-size: 0.7rem;">${new Date(msg.created_at).toLocaleString()}</small>
                                    </div>
                                </div>
                                <div class="d-flex align-items-start mt-2" style="padding-left: 1rem; border-left: 2px solid #e5e7eb; margin-left: 0.5rem;">
                                    <span class="badge bg-success me-2 mt-1" style="font-size: 0.7rem;">Bot</span>
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

// Setup infinite scroll
function setupInfiniteScroll() {
    const scrollContainer = window;

    scrollContainer.addEventListener('scroll', () => {
        const scrollTop = scrollContainer.scrollY || scrollContainer.scrollTop;
        const windowHeight = scrollContainer.innerHeight || document.documentElement.clientHeight;
        const documentHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

        if (scrollTop + windowHeight >= documentHeight - 200) {
            loadMoreConversations();
        }
    });
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
