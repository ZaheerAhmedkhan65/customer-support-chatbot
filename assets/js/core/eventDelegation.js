document.addEventListener(
    "click",
    e => {

        const toggle =
            e.target.closest(
                "[data-toggle-password]"
            );

        if (toggle) {

            const input =
                document.querySelector(
                    toggle.dataset.target
                );

            input.type =
                input.type === "password"
                    ? "text"
                    : "password";

        }

        const modal =
            e.target.closest(
                "[data-open-modal]"
            );

        if (modal) {

            document
                .querySelector(
                    modal.dataset.openModal
                )
                .classList
                .add("show");

        }

    });