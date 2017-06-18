var Router = require('restify-router').Router;
var db = require("../../../db");
var DeliveryOrderManager = require("dl-module").managers.purchasing.DeliveryOrderManager;
var resultFormatter = require("../../../result-formatter");
var ObjectId = require("mongodb").ObjectId;
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get("/", passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new DeliveryOrderManager(db, {
                username: 'router'
            });

            var query = request.queryInfo;

            var filter = {
                "_deleted": false,
                "isClosed": false,
                "supplierId": new ObjectId(query.filter.supplierId),
                "items": {
                    $elemMatch: {
                        "fulfillments": {
                            $elemMatch: {
                                "purchaseOrder.unitId": new ObjectId(query.filter.unitId)
                            }
                        }
                    }
                }
            };
            query.filter = filter;

            var select = [
                "no",
                "refNo",
                "date",
                "supplierDoDate",
                "supplierId",
                "supplier._id",
                "supplier.code",
                "supplier.name",
                "isPosted",
                "isClosed",
                "items.isClosed",
                "items.purchaseOrderExternalId",
                "items.purchaseOrderExternal.no",
                "items.purchaseOrderExternal._id",
                "items.fulfillments.purchaseOrderQuantity",
                "items.fulfillments.purchaseOrderUom._id",
                "items.fulfillments.purchaseOrderUom.unit",
                "items.fulfillments.deliveredQuantity",
                "items.fulfillments.realizationQuantity",
                "items.fulfillments.productId",
                "items.fulfillments.product._id",
                "items.fulfillments.product.code",
                "items.fulfillments.product.name",
                "items.fulfillments.purchaseOrderId",
                "items.fulfillments.purchaseOrder._id",
                "items.fulfillments.purchaseOrder.purchaseOrderExternal.no",
                "items.fulfillments.purchaseOrder.purchaseOrderExternal._id",
                "items.fulfillments.purchaseOrder.unitId",
                "items.fulfillments.purchaseOrder.unit._id",
                "items.fulfillments.purchaseOrder.unit.code",
                "items.fulfillments.purchaseOrder.unit.name",
                "items.fulfillments.purchaseOrder.unit.divisionId",
                "items.fulfillments.purchaseOrder.currency._id",
                "items.fulfillments.purchaseOrder.currency.symbol",
                "items.fulfillments.purchaseOrder.currency.code",
                "items.fulfillments.purchaseOrder.currency.rate",
                "items.fulfillments.purchaseOrder.currencyRate",
                "items.fulfillments.purchaseOrder.categoryId",
                "items.fulfillments.purchaseOrder.category._id",
                "items.fulfillments.purchaseOrder.purchaseRequest.no",
                "items.fulfillments.purchaseOrder.purchaseRequest._id",
                "items.fulfillments.purchaseOrder.items.useIncomeTax",
                "items.fulfillments.purchaseOrder.items.product._id",
                "items.fulfillments.purchaseOrder.items.product.code",
                "items.fulfillments.purchaseOrder.items.product.name",
                "items.fulfillments.purchaseOrder.items.pricePerDealUnit"
            ];

            query.select = select

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