/**
 * SPA Navigation Module
 * Handles client-side navigation with History API
 */

// Track if we're currently navigating
let isNavigating = false;

/**
 * Initialize navigation event listeners
 */
document.addEventListener("click", async e => {
    const link = e.target.closest("[data-link]");

    if (!link) return;

    // Skip if link opens in new tab/window or is an external link
    if (link.target === "_blank") return;

    // Skip if link has download attribute
    if (link.hasAttribute("download")) return;

    // Skip if link is a mailto or tel link
    const href = link.getAttribute("href");
    if (href && (href.startsWith("mailto:") || href.startsWith("tel:"))) return;

    // Skip if link has a different origin (external links)
    if (link.origin && link.origin !== window.location.origin) return;

    e.preventDefault();

    const url = link.href || link.getAttribute("href");
    if (!url) return;

    // Navigate with SPA
    await navigate(url);
});

/**
 * Navigate to a URL using SPA navigation
 * @param {string} url - The URL to navigate to
 * @param {Object} options - Navigation options
 * @param {boolean} options.replace - If true, replaces current history entry instead of pushing
 * @param {boolean} options.skipCache - If true, bypasses cache and fetches fresh content
 */
async function navigate(url, options = {}) {
    const { replace = false, skipCache = false } = options;

    // Prevent concurrent navigations
    if (isNavigating) {
        // Abort previous navigation
        if (SPA.controller) {
            SPA.controller.abort();
        }
    }

    isNavigating = true;

    // Create new abort controller for this navigation
    SPA.controller = new AbortController();

    // Show loader
    showLoader();

    // Save scroll position for current page
    const currentPath = window.location.pathname + window.location.search;
    SPA.scrollMemory[currentPath] = window.scrollY;

    // Check cache first (unless skipCache is true)
    if (!skipCache && SPA.cache.has(url)) {
        updatePage(SPA.cache.get(url), url, replace);
        hideLoader();
        isNavigating = false;
        return;
    }

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html, application/xhtml+xml'
            },
            signal: SPA.controller.signal,
            credentials: 'same-origin'
        });

        // Handle non-OK responses
        if (!res.ok) {
            if (res.status === 404) {
                console.error('Page not found:', url);
                // Optionally redirect to 404 page
            } else if (res.status >= 500) {
                console.error('Server error:', res.status);
            }
            hideLoader();
            isNavigating = false;
            return;
        }

        const html = await res.text();

        // Cache the response
        SPA.cache.set(url, html);

        updatePage(html, url, replace);

    } catch (err) {
        if (err.name === "AbortError") {
            // Navigation was aborted, which is expected when navigating away quickly
            console.log('Navigation aborted');
        } else {
            console.error('Navigation error:', err);
            // On error, fall back to full page load
            window.location.href = url;
        }
    }

    hideLoader();
    isNavigating = false;
}

/**
 * Update the page content with new HTML
 * @param {string} html - The HTML content to insert
 * @param {string} url - The URL being navigated to
 * @param {boolean} replace - If true, replaces history entry
 */
function updatePage(html, url, replace = false) {
    const contentEl = document.getElementById("content");

    if (!contentEl) {
        console.error('Content element not found');
        return;
    }

    // Update content
    contentEl.innerHTML = html;

    // Update URL in address bar
    if (replace) {
        history.replaceState({ path: url }, '', url);
    } else {
        history.pushState({ path: url }, '', url);
    }

    // Update document title if available in the content
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
        document.title = titleMatch[1].trim();
    }

    // Initialize the new page
    SPA.initPage();

    // Restore or set scroll position
    const scrollPos = SPA.scrollMemory[url];
    if (scrollPos !== undefined) {
        window.scrollTo(0, scrollPos);
    } else {
        window.scrollTo(0, 0);
    }

    // Dispatch custom event for external listeners
    document.dispatchEvent(new CustomEvent('spa:navigation', {
        detail: { url, replace }
    }));
}

/**
 * Handle browser back/forward buttons
 */
window.addEventListener("popstate", async e => {
    const url = window.location.pathname + window.location.search;

    // Use replace mode since we're just updating to match the URL
    await navigate(url, { replace: true });
});

/**
 * Make navigate available globally
 */
window.navigate = navigate;

/**
 * Handle initial page load - ensure SPA is initialized
 */
document.addEventListener("DOMContentLoaded", () => {
    // Initialize SPA for the current page
    SPA.initPage();

    // Set initial history state
    if (!history.state) {
        history.replaceState(
            { path: window.location.pathname + window.location.search },
            '',
            window.location.href
        );
    }
});
