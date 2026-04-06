SPA.registerPage(

    "home",

    function init() {

        console.log(
            "home init"
        );

        loadFeed();

    },

    function destroy() {

        console.log(
            "home cleanup"
        );

    }

);

function loadFeed() {

    console.log(
        "loading posts"
    );

}