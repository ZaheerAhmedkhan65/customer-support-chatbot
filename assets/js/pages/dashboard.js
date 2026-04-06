SPA.registerPage(

    "dashboard",

    function init() {

        console.log("dashboard init");
        
        // Initialize dashboard functionality
        initializeDashboard();

    },

    function destroy() {

        console.log("dashboard cleanup");
        
        // Remove listener flags so they can be re-attached on next navigation
        cleanupDashboard();

    }

);

// Initialize dashboard - called on SPA navigation
function initializeDashboard() {
    // Get current tab from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    // Initialize based on tab
    if (tab === 'analytics') {
        if (typeof loadAnalyticsData === 'function') {
            loadAnalyticsData();
        }
        if (typeof setupInfiniteScroll === 'function') {
            setupInfiniteScroll();
        }
    } else if (tab === 'billing') {
        if (typeof loadUsageData === 'function') {
            loadUsageData();
        }
        if (typeof attachBillingEventListeners === 'function') {
            attachBillingEventListeners();
        }
    }

    // Re-attach event listeners for dashboard buttons
    attachDashboardEventListeners();
}

// Attach event listeners for dashboard buttons
function attachDashboardEventListeners() {
    // Copy embed code button
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn && !copyBtn.dataset.listenerAttached) {
        copyBtn.addEventListener('click', function() {
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
        });
        copyBtn.dataset.listenerAttached = 'true';
    }

    // Auto-generate keywords button
    const autoGenBtn = document.getElementById('autoGenerateKeywords');
    if (autoGenBtn && !autoGenBtn.dataset.listenerAttached) {
        autoGenBtn.addEventListener('click', function() {
            const answer = document.getElementById('answer')?.value || '';
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
            const keywordsInput = document.getElementById('keywords');
            if (keywordsInput) {
                keywordsInput.value = uniqueWords.join(', ');
            }
        });
        autoGenBtn.dataset.listenerAttached = 'true';
    }

    // Edit buttons - use event delegation
    const knowledgeList = document.querySelector('.list-group');
    if (knowledgeList && !knowledgeList.dataset.listenerAttached) {
        knowledgeList.addEventListener('click', function(e) {
            const btn = e.target.closest('.edit-btn');
            if (!btn) return;

            const id = btn.getAttribute('data-id');
            const contentType = btn.getAttribute('data-type');
            const question = btn.getAttribute('data-question');
            const answer = btn.getAttribute('data-answer');
            const keywords = btn.getAttribute('data-keywords');

            const editId = document.getElementById('editId');
            const editContentType = document.getElementById('edit_content_type');
            const editQuestion = document.getElementById('edit_question');
            const editAnswer = document.getElementById('edit_answer');
            const editKeywords = document.getElementById('edit_keywords');
            const editForm = document.getElementById('editForm');

            if (editId && editContentType && editQuestion && editAnswer && editKeywords && editForm) {
                editId.value = id;
                editContentType.value = contentType;
                editQuestion.value = question;
                editAnswer.value = answer;
                editKeywords.value = keywords || '';
                editForm.action = '/api/chatbot/knowledge/' + id + '?_method=PUT';

                // Show modal using Bootstrap
                const editModal = document.getElementById('editModal');
                if (editModal) {
                    const modal = bootstrap.Modal.getInstance(editModal) || new bootstrap.Modal(editModal);
                    modal.show();
                }
            }
        });
        knowledgeList.dataset.listenerAttached = 'true';
    }

    // Templates modal - load templates when opened
    const templatesModal = document.getElementById('templatesModal');
    if (templatesModal && !templatesModal.dataset.listenerAttached) {
        templatesModal.addEventListener('show.bs.modal', function() {
            if (typeof loadTemplates === 'function') {
                loadTemplates();
            }
        });
        templatesModal.dataset.listenerAttached = 'true';
    }

    // AI Generate buttons
    const generateFaqBtn = document.getElementById('generateFaqBtn');
    if (generateFaqBtn && !generateFaqBtn.dataset.listenerAttached) {
        generateFaqBtn.addEventListener('click', function() {
            if (typeof generateFAQs === 'function') {
                generateFAQs();
            }
        });
        generateFaqBtn.dataset.listenerAttached = 'true';
    }

    const generateAnswerBtn = document.getElementById('generateAnswerBtn');
    if (generateAnswerBtn && !generateAnswerBtn.dataset.listenerAttached) {
        generateAnswerBtn.addEventListener('click', function() {
            if (typeof generateAnswer === 'function') {
                generateAnswer();
            }
        });
        generateAnswerBtn.dataset.listenerAttached = 'true';
    }

    const extractKeywordBtn = document.getElementById('extractKeywordBtn');
    if (extractKeywordBtn && !extractKeywordBtn.dataset.listenerAttached) {
        extractKeywordBtn.addEventListener('click', function() {
            if (typeof extractKeywords === 'function') {
                extractKeywords();
            }
        });
        extractKeywordBtn.dataset.listenerAttached = 'true';
    }

    const addToKnowledgeBaseBtn = document.getElementById('addToKnowledgeBaseBtn');
    if (addToKnowledgeBaseBtn && !addToKnowledgeBaseBtn.dataset.listenerAttached) {
        addToKnowledgeBaseBtn.addEventListener('click', function() {
            if (typeof addGeneratedContent === 'function') {
                addGeneratedContent();
            }
        });
        addToKnowledgeBaseBtn.dataset.listenerAttached = 'true';
    }

    const importJsonBtn = document.getElementById('importJsonBtn');
    if (importJsonBtn && !importJsonBtn.dataset.listenerAttached) {
        importJsonBtn.addEventListener('click', function() {
            if (typeof importJSON === 'function') {
                importJSON();
            }
        });
        importJsonBtn.dataset.listenerAttached = 'true';
    }

    // Cancel subscription button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn && !cancelBtn.dataset.listenerAttached) {
        cancelBtn.addEventListener('click', function() {
            if (typeof cancelSubscription === 'function') {
                cancelSubscription();
            }
        });
        cancelBtn.dataset.listenerAttached = 'true';
    }
}

// Cleanup function
function cleanupDashboard() {
    // Remove listener flags so they can be re-attached on next navigation
    const elements = document.querySelectorAll('[data-listener-attached]');
    elements.forEach(el => delete el.dataset.listenerAttached);
}
