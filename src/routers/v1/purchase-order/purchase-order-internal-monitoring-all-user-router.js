var Router = require('restify-router').Router;
var db = require("../../../db");
var PurchaseOrderManager = require("dl-module").managers.purchasing.PurchaseOrderManager;
var DeliveryOrderManager = require("dl-module").managers.purchasing.DeliveryOrderManager;
var resultFormatter = require("../../../result-formatter");

var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get('/', passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new PurchaseOrderManager(db, request.user);

            var unitId = request.params.unitId;
            var categoryId = request.params.categoryId;
            var dateFrom = request.params.dateFrom;
            var dateTo = request.params.dateTo;
            var offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;
            manager.getDataPOIntNotPostMonitoring(unitId, categoryId, dateFrom, dateTo, offset)
                .then(docs => {

                    var dateFormat = "DD/MM/YYYY";
                    var dateFormat2 = "DD MMM YYYY";
                    var locale = 'id-ID';
                    var moment = require('moment');
                    moment.locale(locale);

                    var data = [];
                    var index = 0;
                    for (var PO of docs) {
                        for (var item of PO.items) {
                             index++;
                                var _item = {
                                    "No" : index,
                                    "Unit": `${PO.unit.division.name} - ${PO.unit.name}`,
                                    "Kategori": PO.category.name,
                                    "No Purchase Request": PO.refNo,
                                    "Tanggal Purchase Request": moment(new Date(PO.date)).format(dateFormat),
                                    "Tanggal Diminta Datang": PO.expectedDeliveryDate ? moment(new Date(PO.expectedDeliveryDate)).add(offset, 'h').format(dateFormat) : "-",
                                    "Kode Barang": item.product.code,
                                    "Nama Barang": item.product.name,
                                    "Jumlah Barang": item.defaultQuantity,
                                    "Satuan Barang": item.defaultUom.unit,
                                    "Staff": PO._createdBy,
                                }
                                data.push(_item);
                        }
                    }
                    if ((request.headers.accept || '').toString().indexOf("application/xls") < 0) {
                        var result = resultFormatter.ok(apiVersion, 200, data);
                        response.send(200, result);
                    }
                    else {
                        var options = {
                            "No" : "number",
                            "Unit": "string",
                            "Kategori": "string",
                            "No Purchase Request": "string",
                            "Tanggal Purchase Request": "string",
                            "Tanggal Diminta Datang": "string",
                            "Kode Barang": "string",
                            "Nama Barang": "string",
                            "Jumlah Barang": "number",
                            "Satuan Barang": "string",
                            "Staff Pembelian": "string",
                        };

                        response.xls(`Laporan Monitoring PO Internal Belum Proses - ${moment(new Date()).add(offset, 'h').format(dateFormat2)}.xlsx`, data, options);
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