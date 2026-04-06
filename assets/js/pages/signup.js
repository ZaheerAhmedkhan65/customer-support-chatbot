SPA.registerPage(

    "signup",

    function init() {

        console.log(
            "signup init"
        );

        initializePasswordToggle();

    },

    function destroy() {

        console.log(
            "signup cleanup"
        );

    }

);