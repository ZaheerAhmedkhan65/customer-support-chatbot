window.ComponentRegistry = {};

window.registerComponent =
    function (name, init) {

        ComponentRegistry[name] = init;

    };