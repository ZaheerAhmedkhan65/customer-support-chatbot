document.addEventListener(
    "mouseover",
    e => {

        const link =
            e.target.closest("[data-link]");

        if (!link) return;

        const url = link.href;

        if (SPA.cache.has(url))
            return;

        fetch(url, {
            headers: {
                'X-Requested-With':
                    'XMLHttpRequest'
            }
        })
            .then(res => res.text())
            .then(html => {

                SPA.cache.set(
                    url,
                    html
                );

            });

    });