window.SPA = {

    pages: {},

    components: [],

    currentPage: null,

    cache: new Map(),

    scrollMemory: {},

    controller: null,

    loadedScripts: new Set(),

    pageScripts: {},

    initCallbacks: [],

    /**
     * Register a page with init and destroy callbacks
     * @param {string} name - Page identifier (matches data-page attribute)
     * @param {Function} init - Initialization function called when page loads
     * @param {Function} destroy - Cleanup function called when leaving page
     */
    registerPage(name, init, destroy) {
        this.pages[name] = {
            init: init || function () {},
            destroy: destroy || function () {}
        };
    },

    /**
     * Register a global component that initializes on every page
     * @param {Function} init - Component initialization function
     */
    registerComponent(init) {
        this.components.push(init);
    },

    /**
     * Register scripts that should be loaded for a specific page
     * @param {string} pageName - Page identifier
     * @param {string|string[]} scriptUrls - URL(s) of scripts to load
     */
    registerPageScripts(pageName, scriptUrls) {
        this.pageScripts[pageName] = Array.isArray(scriptUrls) ? scriptUrls : [scriptUrls];
    },

    /**
     * Add a callback to run after page initialization
     * @param {Function} callback
     */
    onInit(callback) {
        this.initCallbacks.push(callback);
    },

    /**
     * Initialize the current page
     * Called after navigation or on initial page load
     */
    initPage() {
        const pageEl = document.querySelector("[data-page]");

        if (!pageEl) return;

        const name = pageEl.dataset.page;

        // Destroy previous page
        if (this.currentPage && this.pages[this.currentPage]) {
            this.destroyPage(this.currentPage);
        }

        // Initialize new page
        if (this.pages[name]) {
            this.pages[name].init();
            this.currentPage = name;

            // Load page-specific scripts
            this.loadPageScripts(name);
        }

        // Initialize global components
        this.initComponents();

        // Run init callbacks
        this.initCallbacks.forEach(cb => cb(name));

        // Dispatch custom event for external listeners
        document.dispatchEvent(new CustomEvent('spa:pageinit', { detail: { page: name } }));
    },

    /**
     * Destroy a page and run cleanup
     * @param {string} name - Page identifier
     */
    destroyPage(name) {
        if (this.pages[name] && this.pages[name].destroy) {
            this.pages[name].destroy();
        }

        // Dispatch custom event for external listeners
        document.dispatchEvent(new CustomEvent('spa:pagedestroy', { detail: { page: name } }));
    },

    /**
     * Initialize all registered global components
     */
    initComponents() {
        this.components.forEach(init => {
            init();
        });
    },

    /**
     * Load page-specific scripts dynamically
     * @param {string} pageName - Page identifier
     */
    loadPageScripts(pageName) {
        const scripts = this.pageScripts[pageName];
        if (!scripts) return;

        scripts.forEach(src => {
            if (this.loadedScripts.has(src)) return;

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            document.body.appendChild(script);

            this.loadedScripts.add(src);
        });
    },

    /**
     * Get the current page name
     * @returns {string|null}
     */
    getCurrentPage() {
        return this.currentPage;
    },

    /**
     * Check if a page is registered
     * @param {string} name
     * @returns {boolean}
     */
    hasPage(name) {
        return name in this.pages;
    },

    /**
     * Navigate to a URL using SPA navigation
     * @param {string} url
     * @param {Object} options
     */
    navigate(url, options = {}) {
        if (typeof navigate === 'function') {
            navigate(url, options);
        } else {
            window.location.href = url;
        }
    }
};
