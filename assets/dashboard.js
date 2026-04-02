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