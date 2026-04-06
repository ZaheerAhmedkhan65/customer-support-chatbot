SPA.registerPage(

    "signin",

    function init() {

        console.log(
            "signin init"
        );

        initializePasswordToggle();

    },

    function destroy() {

        console.log(
            "signin cleanup"
        );

    }

);


