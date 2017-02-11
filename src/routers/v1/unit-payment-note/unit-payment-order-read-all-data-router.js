var Router = require('restify-router').Router;
var db = require("../../../db");
var UnitPaymentOrderManager = require("dl-module").managers.purchasing.UnitPaymentOrderManager;
var resultFormatter = require("../../../result-formatter");
var ObjectId = require("mongodb").ObjectId;
const apiVersion = '1.0.0';
var passport = require('../../../passports/jwt-passport');

function getRouter() {
    var router = new Router();
    var getManager = (user) => {
        return db.get()
            .then((db) => {
                return Promise.resolve(new UnitPaymentOrderManager(db, user));
            });
    };

    router.get("/", passport, function (request, response, next) {
        var user = request.user;
        var query = request.query;
        query.order = {
            "_updatedDate": -1
        };
        var filter = {
            "_deleted": false
        };
        Object.assign(query.filter, filter);
        
        getManager(user)
            .then((manager) => {
                return manager.read(query);
            })
            .then(docs => {
                var result = resultFormatter.ok(apiVersion, 200, docs.data);
                delete docs.data;
                result.info = docs;
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
    });

    return router;
}

module.exports = getRouter;