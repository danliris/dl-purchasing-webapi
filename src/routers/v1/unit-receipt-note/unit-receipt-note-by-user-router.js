const apiVersion = '1.0.0';
var Manager = require("dl-module").managers.purchasing.UnitReceiptNoteManager;
var resultFormatter = require("../../../result-formatter");
var db = require("../../../db");
var JwtRouterFactory = require("../../jwt-router-factory");

var handlePdfRequest = function (request, response, next) {
    db.get()
        .then(db => {
            var manager = new Manager(db, request.user);
            var id = request.params.id;
            manager.pdf(id)
                .then(docBinary => {
                    manager.getSingleById(id)
                        .then(doc => {
                            response.writeHead(200, {
                                'Content-Type': 'application/pdf',
                                'Content-Disposition': `attachment; filename=${doc.no}.pdf`,
                                'Content-Length': docBinary.length
                            });
                            response.end(docBinary);
                        })
                        .catch(e => {
                            var error = resultFormatter.fail(apiVersion, 400, e);
                            response.send(400, error);
                        });
                })
                .catch(e => {
                    var error = resultFormatter.fail(apiVersion, 400, e);
                    response.send(400, error);
                });
        })
        .catch(e => {
            var error = resultFormatter.fail(apiVersion, 400, e);
            response.send(400, error);
        });
};

function getRouter() {
    var router = JwtRouterFactory(Manager, {
        version: apiVersion,
        defaultOrder: {
            "_updatedDate": -1
        },
        defaultFilter: (request, response, next) => {
            return {
                "_createdBy": request.user.username
            };
        },
        defaultSelect: ["unit.division.name", "unit.name", , "no", "date", "supplier.name", "deliveryOrder.no"]
    });

    var route = router.routes["get"].find(route => route.options.path === "/:id");
    route.handlers[route.handlers.length - 1] = function (request, response, next) {
        if ((request.headers.accept || '').toString().indexOf("application/pdf") >= 0) {
            next();
        }
        else {
            var id = request.params.id;
            db.get()
                .then(db => {
                    var manager = new Manager(db, request.user);
                    return Promise.resolve(manager);
                })
                .then((manager) => {
                    return manager.getSingleByIdOrDefault(id);
                })
                .then((doc) => {
                    var result;
                    if (!doc) {
                        result = resultFormatter.fail(apiVersion, 404, new Error("data not found"));
                    }
                    else {
                        result = resultFormatter.ok(apiVersion, 200, doc);
                    }
                    return Promise.resolve(result);
                })
                .then((result) => {
                    response.send(result.statusCode, result);
                })
                .catch((e) => {
                    var statusCode = 500;
                    if (e.name === "ValidationError")
                        statusCode = 400;
                    var error = resultFormatter.fail(apiVersion, statusCode, e);
                    response.send(statusCode, error);
                });
        }
    };
    route.handlers.push(handlePdfRequest);
    return router;
}

module.exports = getRouter;