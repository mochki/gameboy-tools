SystemJS.import("./frontend/main.js")
    .then(function (main) { main.default(); })
    .catch(console.error);