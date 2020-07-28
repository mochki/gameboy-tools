SystemJS.config({
    map: {
        "imgui-js": "./lib/imgui-js/",
    },
    packages: {
        "imgui-js": {
            main: "imgui.js",
            defaultExtension: 'js'
        },
        ".": {
            defaultExtension: 'js'
        }
    }
});