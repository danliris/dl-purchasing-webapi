var Router = require('restify-router').Router;
var db = require("../../../db");
var PurchaseOrderManager = require("dl-module").managers.purchasing.PurchaseOrderManager;
var resultFormatter = require("../../../result-formatter");

var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get("/", passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new PurchaseOrderManager(db, request.user);

            var query = request.queryInfo;

            var filter = {
                _deleted: false,
                isPosted: false
            };

            query.filter = filter;

            var select = [
                "_id",
                "no",
                "refNo",
                "purchaseRequestId",
                "purchaseRequest._id",
                "purchaseRequest.no",
                "purchaseOrderExternalId",
                "purchaseOrderExternal._id",
                "purchaseOrderExternal.no",
                "supplierId",
                "supplier.code",
                "supplier.name",
                "supplier.address",
                "supplier.contact",
                "supplier.PIC",
                "supplier.import",
                "supplier.NPWP",
                "supplier.serialNumber",
                "unitId",
                "unit.code",
                "unit.divisionId",
                "unit.division",
                "unit.name",
                "categoryId",
                "category.code",
                "category.name",
                "freightCostBy",
                "currency.code",
                "currency.symbol",
                "currency.rate",
                "currencyRate",
                "paymentMethod",
                "paymentDueDays",
                "vat",
                "useVat",
                "vatRate",
                "useIncomeTax",
                "date",
                "expectedDeliveryDate",
                "actualDeliveryDate",
                "isPosted",
                "isClosed",
                "remark",
                "status",
                "items"
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
