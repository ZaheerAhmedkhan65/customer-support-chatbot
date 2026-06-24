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

    // Auto-generate keywords on answer keystroke (debounced)
    const answerInput = document.getElementById('answer');
    const keywordsInput = document.getElementById('keywords');
    if (answerInput && keywordsInput && !answerInput.dataset.keywordListenerAttached) {
        let keywordTimeout;
        answerInput.addEventListener('input', function() {
            clearTimeout(keywordTimeout);
            keywordTimeout = setTimeout(function() {
                const answer = answerInput.value || '';
                if (!answer.trim()) {
                    keywordsInput.value = '';
                    return;
                }

                const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'been', 'being', 'do', 'does', 'did', 'doing', 'would', 'should', 'could', 'will', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'having'];

                const words = answer.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .split(/\s+/)
                    .filter(word => word.length > 2 && !stopWords.includes(word));

                const uniqueWords = [...new Set(words)].slice(0, 10);
                keywordsInput.value = uniqueWords.join(', ');
            }, 300);
        });
        answerInput.dataset.keywordListenerAttached = 'true';
    }

    // Knowledge list actions (Show, Edit, Bulk delete)
    const knowledgeList = document.querySelector('#knowledgeList');
    if (knowledgeList && !knowledgeList.dataset.listenerAttached) {
        knowledgeList.addEventListener('click', function(e) {
            const showBtn = e.target.closest('.show-item-btn');
            const editBtn = e.target.closest('.edit-btn');

            if (showBtn) {
                const id = showBtn.getAttribute('data-id');
                const contentType = showBtn.getAttribute('data-type');
                const question = showBtn.getAttribute('data-question');
                const answer = showBtn.getAttribute('data-answer');
                const keywords = showBtn.getAttribute('data-keywords');

                document.getElementById('showType').textContent = (contentType || 'general').toUpperCase();
                document.getElementById('showQuestion').textContent = question || 'General Information';
                document.getElementById('showAnswer').textContent = answer || '';
                document.getElementById('showKeywords').textContent = keywords || '';

                const showModal = document.getElementById('showModal');
                if (showModal) {
                    const modal = bootstrap.Modal.getInstance(showModal) || new bootstrap.Modal(showModal);
                    modal.show();
                }
                return;
            }

            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                const contentType = editBtn.getAttribute('data-type');
                const question = editBtn.getAttribute('data-question');
                const answer = editBtn.getAttribute('data-answer');
                const keywords = editBtn.getAttribute('data-keywords');

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

                    const editModal = document.getElementById('editModal');
                    if (editModal) {
                        const modal = bootstrap.Modal.getInstance(editModal) || new bootstrap.Modal(editModal);
                        modal.show();
                    }
                }
            }
        });
        knowledgeList.dataset.listenerAttached = 'true';
    }

    // Bulk delete handlers
    const bulkDeleteToggle = document.getElementById('bulkDeleteToggle');
    const bulkDeleteBar = document.getElementById('bulkDeleteBar');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    function updateBulkDeleteButton() {
        if (!deleteSelectedBtn) return;
        const count = document.querySelectorAll('.bulk-check:checked').length;
        deleteSelectedBtn.disabled = count === 0;
        deleteSelectedBtn.textContent = count <= 1 ? 'Delete' : 'Bulk Delete';
    }
    if (bulkDeleteToggle && bulkDeleteBar && !bulkDeleteToggle.dataset.listenerAttached) {
        bulkDeleteToggle.addEventListener('click', function() {
            const isActive = !bulkDeleteBar.classList.contains('d-none');
            if (isActive) {
                bulkDeleteBar.classList.add('d-none');
                document.querySelectorAll('.bulk-check-wrap').forEach(el => el.classList.add('d-none'));
                document.querySelectorAll('.bulk-check').forEach(el => el.checked = false);
                updateBulkDeleteButton();
            } else {
                bulkDeleteBar.classList.remove('d-none');
                document.querySelectorAll('.bulk-check-wrap').forEach(el => el.classList.remove('d-none'));
            }
        });
        bulkDeleteToggle.dataset.listenerAttached = 'true';
    }

    if (knowledgeList && !knowledgeList.dataset.bulkListenerAttached) {
        knowledgeList.addEventListener('click', function(e) {
            const deleteTrigger = e.target.closest('.delete-trigger-btn');
            if (!deleteTrigger) return;

            const id = deleteTrigger.getAttribute('data-id');
            bulkDeleteBar.classList.remove('d-none');
            document.querySelectorAll('.bulk-check-wrap').forEach(el => el.classList.remove('d-none'));

            const target = document.querySelector(`.list-group-item[data-id="${id}"] .bulk-check`);
            if (target) target.checked = true;
            updateBulkDeleteButton();
        });
        knowledgeList.dataset.bulkListenerAttached = 'true';
    }

    if (!window._bulkChangeHandlerAttached) {
        document.addEventListener('change', function(e) {
            if (e.target.classList.contains('bulk-check')) {
                updateBulkDeleteButton();
            }
        });
        window._bulkChangeHandlerAttached = true;
    }

    if (deleteSelectedBtn && !window._deleteSelectedHandlerAttached) {
        deleteSelectedBtn.addEventListener('click', function() {
            const checked = Array.from(document.querySelectorAll('.bulk-check:checked')).map(cb => cb.value);
            if (checked.length === 0) return;
            if (!confirm(`Delete ${checked.length} selected item${checked.length > 1 ? 's' : ''}?`)) return;

            if (deleteSelectedBtn.disabled) return;
            deleteSelectedBtn.disabled = true;
            deleteSelectedBtn.textContent = 'Deleting...';

            const promises = checked.map(id =>
                fetch('/api/chatbot/knowledge/' + id + '?_method=DELETE', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    redirect: 'manual',
                    credentials: 'same-origin'
                }).then(res => {
                    if (res.status === 204 || res.type === 'opaque') {
                        return { success: true };
                    }
                    if (res.redirected) {
                        return { success: true };
                    }
                    return res.text().then(text => {
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            console.error('Invalid JSON response:', text);
                            return { success: false, message: 'Invalid server response' };
                        }
                    });
                })
            );

            Promise.all(promises)
                .then(results => {
                    const failed = results.find(r => !r.success);
                    if (failed) {
                        alert(failed.message || 'Failed to delete some items');
                        deleteSelectedBtn.disabled = false;
                        updateBulkDeleteButton();
                    } else {
                        alert('Knowledge deleted successfully!');
                        setTimeout(() => {
                            window.location.href = '/dashboard?tab=knowledge';
                        }, 150);
                    }
                })
                .catch(() => {
                    alert('Failed to delete some items');
                    deleteSelectedBtn.disabled = false;
                    updateBulkDeleteButton();
                });
        });
        window._deleteSelectedHandlerAttached = true;
    }

    // Crawl website button
    const crawlBtn = document.getElementById('crawlBtn');
    if (crawlBtn && !crawlBtn.dataset.listenerAttached) {
        crawlBtn.addEventListener('click', function() {
            if (typeof crawlWebsite === 'function') {
                crawlWebsite();
            }
        });
        crawlBtn.dataset.listenerAttached = 'true';
    }

    // Import crawled entries button
    const importCrawledBtn = document.getElementById('importCrawledBtn');
    if (importCrawledBtn && !importCrawledBtn.dataset.listenerAttached) {
        importCrawledBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof importCrawledEntries === 'function') {
                importCrawledEntries();
            }
        });
        importCrawledBtn.dataset.listenerAttached = 'true';
    }

    // Allow pressing Enter in crawl URL field to trigger crawl
    const crawlUrl = document.getElementById('crawlUrl');
    if (crawlUrl && !crawlUrl.dataset.listenerAttached) {
        crawlUrl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof crawlWebsite === 'function') {
                    crawlWebsite();
                }
            }
        });
        crawlUrl.dataset.listenerAttached = 'true';
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
    // No action needed. Per-element data-listener-attached and per-feature window flags
    // (_bulkChangeHandlerAttached, _deleteSelectedHandlerAttached) already prevent duplicates.
}
