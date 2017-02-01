var Router = require('restify-router').Router;
var db = require("../../../db");
var UnitReceiptNoteManager = require("dl-module").managers.purchasing.UnitReceiptNoteManager;
var resultFormatter = require("../../../result-formatter");
var ObjectId = require("mongodb").ObjectId;
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get("/", passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new UnitReceiptNoteManager(db, {
                username: 'router'
            });

            var query = request.queryInfo;
            var filter = {
                "_deleted": false,
                "isPaid": false,
                "supplierId": new ObjectId(query.filter.supplierId),
                "unit.divisionId": new ObjectId(query.filter.divisionId),
                "items": {
                    $elemMatch:
                    {
                        "purchaseOrder.categoryId": new ObjectId(query.filter.categoryId),
                        "purchaseOrder.paymentMethod": query.filter.paymentMethod,
                        "purchaseOrder.currency.code": query.filter.currencyCode,
                        "purchaseOrder.vatRate": query.filter.vatRate || 0,
                        "purchaseOrder.useIncomeTax": query.filter.useIncomeTax || false
                    }

                }
            };

            query.filter = filter;
            manager.read(query)
                .then(docs => {
                    var result = resultFormatter.ok(apiVersion, 200, docs.data);
                    delete docs.data;
                    result.info = docs;
                    response.send(200, result);
                })
                .catch(e => {
                    response.send(500, "gagal ambil data");
                });
        })
            .catch(e => {
                var error = resultFormatter.fail(apiVersion, 400, e);
                response.send(400, error);
            });
    });
    return router;
}
module.exports = getRouter;