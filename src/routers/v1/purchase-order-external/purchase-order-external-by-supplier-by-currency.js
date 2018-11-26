var Router = require('restify-router').Router;
var db = require("../../../db");
var PurchaseOrderExternalManager = require("dl-module").managers.purchasing.PurchaseOrderExternalManager;
var resultFormatter = require("../../../result-formatter");
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';
var ObjectId = require("mongodb").ObjectId;

var DLModels = require('dl-models');
var poStatusEnum = DLModels.purchasing.enum.PurchaseOrderStatus;

function getRouter() {
    var router = new Router();
    router.get("/", passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new PurchaseOrderExternalManager(db, request.user);

            var query = request.queryInfo;

            var filter = {
                _deleted: false,
                isPosted: true,
                isClosed: false,
                supplierId: new ObjectId(query.filter.supplierId),
                "currency._id": new ObjectId(query.filter.currencyId)
            };

            query.filter = filter;

            var select = [
                "_id",
                "no",
                "items._id",
                "items.no",
                "items.unitId",
                "useVat",
                "vat._id",
                "vat.rate",
                "vat.name",
                "items.unitId",
                "items.unit._id",
                "items.unit.code",
                "items.unit.name",
                "items.unit.divisionId",
                "items.unit.division",
                "items.currency._id",
                "items.currency.symbol",
                "items.currency.code",
                "items.currency.rate",
                "items.currencyRate",
                "items.categoryId",
                "items.category._id",
                "items.category.code",
                "items.category.name",
                "items.purchaseRequest.no",
                "items.purchaseRequest._id",
                "items.items.product._id",
                "items.items.product.code",
                "items.items.product.name",
                "items.items.defaultQuantity",
                "items.items.defaultUom.unit",
                "items.items.dealQuantity",
                "items.items.dealUom.unit",
                "items.items.dealUom._id",
                "items.items.realizationQuantity",
                "items.items.pricePerDealUnit",
                "items.items.priceBeforeTax",
                "items.items.conversion",
                "items.items.isClosed",
                "useIncomeTax",
                "items.items.remark",
                "items.items.fulfillments"
            ];

            query.select = select;

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
