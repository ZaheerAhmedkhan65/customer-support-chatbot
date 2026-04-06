window.PageRegistry = {};

window.registerPage =
    function (name, init, destroy) {

        PageRegistry[name] = {

            init: init || function () { },

            destroy: destroy || function () { }

        };

    };