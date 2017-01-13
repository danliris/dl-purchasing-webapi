var server = require('./server');
var ApiEndpointManager = require("dl-module").managers.auth.ApiEndpointManager;
var db = require("./src/db");

server().then((server) => {
    db.get()
        .then((db) => {
            var endpointManager = new ApiEndpointManager(db, {
                username: "purchasing-api"
            });

            var ops = [];
            for (var method in server.router.routes) {
                var endpoints = server.router.routes[method].map((route) => {
                    var spec = route.spec;
                    return {
                        name: spec.name,
                        method: spec.method,
                        uri: spec.path
                    };
                });
                ops.push(endpointManager.registerMany(endpoints));
            }
            return Promise.all(ops);
        })
        .then((results) => {
            server.listen(process.env.PORT, process.env.IP);
            console.log(`server created at ${process.env.IP}:${process.env.PORT}`);
        });
});
