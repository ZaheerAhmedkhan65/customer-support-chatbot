document.addEventListener(
    "click",
    e => {
        
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