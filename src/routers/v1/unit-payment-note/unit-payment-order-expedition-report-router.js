let Router = require('restify-router').Router;
let db = require("../../../db");
let resultFormatter = require("../../../result-formatter");
const apiVersion = '1.0.0';
let UnitPaymentOrderManager = require("dl-module").managers.purchasing.UnitPaymentOrderManager;
let passport = require('../../../passports/jwt-passport');

function getRouter() {
    let router = new Router();

    router.get("/", passport, function (request, response, next) {
        db.get().then(db => {
            let user = request.user;
            let query = request.query;

            query.filter = Object.assign({}, query.filter);
            query.order = Object.assign({}, query.order);
            query.select = query.select || [];

            let manager = new UnitPaymentOrderManager(db, request.user);
            let offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;

            manager.getExpeditionReport(query, offset)
                .then(docs => {
                    let result = resultFormatter.ok(apiVersion, 200, docs.data);
                    delete docs.data;
                    result.info = docs;
                    return Promise.resolve(result);
                })
                .then((result) => {
                    response.send(result.statusCode, result);
                })
                .catch((e) => {
                    let statusCode = 500;
                    if (e.name === "ValidationError")
                        statusCode = 400;
                    let error = resultFormatter.fail(apiVersion, statusCode, e);
                    response.send(statusCode, error);
                });
        });
    });
    return router;
}

module.exports = getRouter;
