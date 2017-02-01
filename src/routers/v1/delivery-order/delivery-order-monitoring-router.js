var Router = require('restify-router').Router;
var db = require("../../../db");
var PurchaseOrderManager = require("dl-module").managers.purchasing.PurchaseOrderManager;
var DeliveryOrderManager = require("dl-module").managers.purchasing.DeliveryOrderManager;
var resultFormatter = require("../../../result-formatter");

var ObjectId = require("mongodb").ObjectId;
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get('/', passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new DeliveryOrderManager(db, request.user);

            var no = request.params.no;
            var supplierId = request.params.supplierId;
            var dateFrom = request.params.dateFrom;
            var dateTo = request.params.dateTo;

            manager.getDataDeliveryOrder(no, supplierId, dateFrom, dateTo)
                .then(docs => {

                    var dateFormat = "DD/MM/YYYY";
                    var dateFormat2 = "DD MMM YYYY";
                    var locale = 'id-ID';
                    var moment = require('moment');
                    moment.locale(locale);

                    var data = [];
                    var index = 0;
                    for (var deliveryOrder of docs) {
                        for (var item of deliveryOrder.items) {
                            for (var fulfillment of item.fulfillments) {
                                var sisa = 0;
                                for (var poItem of fulfillment.purchaseOrder.items) {
                                    var productIdPoItem = new ObjectId(poItem.product._id);
                                    var productIdFulfillment = new ObjectId(fulfillment.product._id);
                                    if (productIdPoItem.equals(productIdFulfillment)) {
                                        for (var poItemFulfillment of poItem.fulfillments) {
                                            sisa += poItemFulfillment.deliveryOrderDeliveredQuantity;
                                        }
                                        break;
                                    }
                                }
                                var _item = {
                                    "Kode Supplier": deliveryOrder.supplier.code,
                                    "Nama Supplier": deliveryOrder.supplier.name,
                                    "Nomor Surat Jalan": deliveryOrder.no,
                                    "Tanggal Surat Jalan": moment(new Date(deliveryOrder.date)).format(dateFormat),
                                    "Tanggal Datang Barang": moment(new Date(deliveryOrder.supplierDoDate)).format(dateFormat),
                                    "Nomor PO Eksternal": item.purchaseOrderExternal.no,
                                    "Kode Barang": fulfillment.product.code,
                                    "Nama Barang": fulfillment.product.name,
                                    "Deskripsi Barang": fulfillment.product.description,
                                    "Jumlah Barang yang Diminta": fulfillment.purchaseOrderQuantity,
                                    "Jumlah Barang yang Datang": fulfillment.deliveredQuantity,
                                    "Jumlah Sisa Barang": `${(fulfillment.purchaseOrderQuantity - sisa)}`,
                                    "Satuan Barang": fulfillment.purchaseOrderUom.unit
                                }
                                data.push(_item);
                            }
                        }
                    }

                    if ((request.headers.accept || '').toString().indexOf("application/xls") < 0) {
                        var result = resultFormatter.ok(apiVersion, 200, data);
                        response.send(200, result);
                    } else {
                        var options = {
                            "Kode Supplier": "string",
                            "Nama Supplier": "string",
                            "Nomor Surat Jalan": "string",
                            "Tanggal Surat Jalan": "string",
                            "Tanggal Datang Barang": "string",
                            "Nomor PO Eksternal": "string",
                            "Kode Barang": "string",
                            "Nama Barang": "string",
                            "Deskripsi Barang": "string",
                            "Jumlah Barang yang Diminta": "number",
                            "Jumlah Barang yang Datang": "number",
                            "Jumlah Sisa Barang": "number",
                            "Satuan Barang": "string"
                        };
                        response.xls(`Monitoring Surat Jalan - ${moment(new Date()).format(dateFormat2)}.xlsx`, data, options);

                    }
                })
                .catch(e => {
                    var error = resultFormatter.fail(apiVersion, 400, e);
                    response.send(400, error);
                })
        })
    });
    return router;
}
module.exports = getRouter;

