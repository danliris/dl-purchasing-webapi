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
            var PODLNo = request.params.PODLNo;
            var PRNo = request.params.PRNo;
            var supplierId = request.params.supplierId;
            var dateFrom = request.params.dateFrom;
            var dateTo = request.params.dateTo;
            var state = parseInt(request.params.state);
            var createdBy = request.user.username;
            var budgetId = request.params.budgetId;
            var offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;
            // manager.getDataPOIntMonitoring(unitId, categoryId, dateFrom, dateTo, "", offset)
            manager.getDataPOIntMonitoring(unitId, categoryId, PODLNo, PRNo, supplierId, dateFrom, dateTo, state, budgetId, "", offset)
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
                            if (item.fulfillments.length > 0) {
                                for (var fulfillment of item.fulfillments) {
                                    index++;

                                    var _correctionNo = "-";
                                    var _correctionPriceTotal = "0";
                                    var _correctionDate = "-";
                                    var _correctionRemark = "-";

                                    if (fulfillment.correction) {
                                        var i = 1;
                                        _correctionNo = "";
                                        _correctionPriceTotal = "";
                                        _correctionDate = "";
                                        _correctionRemark = "";
                                        for (var correction of fulfillment.correction) {
                                            _correctionNo = `${_correctionNo}${i}. ${correction.correctionNo}\n`;
                                            _correctionPriceTotal = `${_correctionPriceTotal}${i}. ${correction.correctionPriceTotal.toLocaleString()}\n`;
                                            _correctionDate = `${_correctionDate}${i}. ${moment(new Date(correction.correctionDate)).add(offset, 'h').format(dateFormat)}\n`;
                                            _correctionRemark = `${_correctionRemark}${i}. ${correction.correctionRemark}\n`;
                                            i++;
                                        }
                                    }

                                    var _item = {
                                        "No" : index,
                                        "Divisi": PO.purchaseRequest.unit.division.name,
                                        "Nama Barang": item.product.name,
                                        "Jumlah Barang": item.dealQuantity ? item.dealQuantity : 0,
                                        "Satuan Barang": item.dealUom.unit ? item.dealUom.unit : "-",
                                        "Unit": PO.unit.name,
                                        "Tanggal Purchase Request": moment(new Date(PO.purchaseRequest.date)).format(dateFormat),
                                        "No Purchase Request": PO.purchaseRequest.no,
                                        "Kategori": PO.category.name,
                                        "Budget": PO.purchaseRequest.budget.name,
                                        "Tanggal Diminta Datang": PO.purchaseOrderExternal.expectedDeliveryDate ? moment(new Date(PO.purchaseOrderExternal.expectedDeliveryDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "Staff": PO._createdBy,
                                        "Status": PO.status ? PO.status.label : "-"
                                    }
                                    data.push(_item);
                                }
                            }
                            else {
                                index++;
                                var _item = {
                                    "No" : index,
                                    "Divisi": PO.purchaseRequest.unit.division.name,
                                    "Nama Barang": item.product.name,
                                    "Jumlah Barang": item.dealQuantity ? item.dealQuantity : 0,
                                    "Satuan Barang": item.dealUom.unit ? item.dealUom.unit : "-",
                                    "Unit": PO.unit.name,
                                    "Tanggal Purchase Request": moment(new Date(PO.purchaseRequest.date)).format(dateFormat),
                                    "No Purchase Request": PO.purchaseRequest.no,
                                    "Kategori": PO.category.name,
                                    "Budget": PO.purchaseRequest.budget.name,
                                    "Tanggal Diminta Datang": PO.purchaseOrderExternal.expectedDeliveryDate ? moment(new Date(PO.purchaseOrderExternal.expectedDeliveryDate)).add(offset, 'h').format(dateFormat) : "-",
                                    "Staff": PO._createdBy,
                                    "Status": PO.status ? PO.status.label : "-"
                                }
                                data.push(_item);
                            }
                        }
                    }
                    if ((request.headers.accept || '').toString().indexOf("application/xls") < 0) {
                        var result = resultFormatter.ok(apiVersion, 200, data);
                        response.send(200, result);
                    }
                    else {
                        var options = {
                            "No" : "number",
                            "Divisi": "string",
                            "Unit": "string",
                            "Nama Barang": "string",
                            "Jumlah Barang": "number",
                            "Satuan Barang": "string",
                            "Tanggal Purchase Request": "string",
                            "No Purchase Request": "string",
                            "Kategori": "string",
                            "Budget": "string",
                            "Tanggal Diminta Datang": "string",
                            "Staff": "string",
                            "Status": "string",
                        };


                        response.xls(`Laporan Monitoring Purchase Order Internal - ${moment(new Date()).add(offset, 'h').format(dateFormat2)}.xlsx`, data, options);
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