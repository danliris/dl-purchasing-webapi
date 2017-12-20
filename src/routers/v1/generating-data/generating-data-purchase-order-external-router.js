var Router = require('restify-router').Router;
var db = require("../../../db");
var PurchaseOrderExternalManager = require("dl-module").managers.purchasing.PurchaseOrderExternalManager;
var resultFormatter = require("../../../result-formatter");
var ObjectId = require("mongodb").ObjectId;
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get('/', passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new PurchaseOrderExternalManager(db, request.user);

            var dateFormat = "DD/MM/YYYY";
            var locale = 'id-ID';
            var moment = require('moment');
            moment.locale(locale);
            var dateFrom = request.params.dateFrom;
            var dateTo = request.params.dateTo;
            var offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;
            var filter = {};
            var qDateFrom = new Date(dateFrom);
            qDateFrom.setHours(qDateFrom.getHours()-offset);
            
            var qDateTo = new Date(dateTo);
            qDateTo.setHours(qDateTo.getHours()-offset);
            
            if (dateFrom && dateTo) {
                filter = {
                    date: {
                        $gte: qDateFrom,
                        $lte: qDateTo
                    }
                };
            }

            manager.getAllData(filter)
                .then(list => {
                    var data = [];
                    for (var _data of list) {
                        for (var _purchaseOrder of _data.items) {
                            for (var item of _purchaseOrder.items) {
                                var _item = {
                                    "NOMOR PO EXTERNAL": _data.no,
                                    "TANGGAL PO EXTERNAL": moment(new Date(_data.date)).add(offset, 'h').format(dateFormat),
                                    "KODE SUPPLIER": _data.supplier.code,
                                    "NAMA SUPPLIER": _data.supplier.name,
                                    "DELIVERY": moment(new Date(_data.expectedDeliveryDate)).add(offset, 'h').format(dateFormat),
                                    "ONGKIR": _data.freightCostBy,
                                    "PAYMENT": _data.paymentMethod,
                                    "TEMPO": _data.paymentDueDays + " hari",
                                    "MATA UANG": _data.currency.code,
                                    "RATE": _data.currency.rate,
                                    "PPN": _data.useIncomeTax ? "Ya" : "Tidak",
                                    "PPH": _data.useVat ? "Ya" : "Tidak",
                                    "% PPH": _data.useVat ? _data.vat.rate : 0,
                                    "KETERANGAN": _data.remark,
                                    "NOMOR PURCHASE REQUEST": _purchaseOrder.purchaseRequest.no,
                                    "KODE BARANG": item.product.code,
                                    "NAMA BARANG": item.product.name,
                                    "JUMLAH BARANG": item.dealQuantity,
                                    "SATUAN BARANG": item.dealUom.unit,
                                    "HARGA SATUAN BARANG": item.pricePerDealUnit,
                                    "HARGA TOTAL BARANG": item.pricePerDealUnit * item.dealQuantity,
                                    "USER INPUT": _data._createdBy,
                                    "STATUS POST": _data.isPosted ? "Sudah diposting" : "Belum diposting"
                                }
                                data.push(_item);
                            }
                        }
                    }
                    var options = {
                        "NOMOR PO EXTERNAL": "string",
                        "TANGGAL PO EXTERNAL": "date",
                        "KODE SUPPLIER": "string",
                        "NAMA SUPPLIER": "string",
                        "DELIVERY": "string",
                        "ONGKIR": "string",
                        "PAYMENT": "string",
                        "TEMPO": "string",
                        "MATA UANG": "string",
                        "RATE": "string",
                        "PPN": "string",
                        "PPH": "string",
                        "% PPH": "string",
                        "KETERANGAN": "string",
                        "NOMOR PURCHASE REQUEST": "string",
                        "KODE BARANG": "string",
                        "NAMA BARANG": "string",
                        "JUMLAH BARANG": "number",
                        "SATUAN BARANG": "string",
                        "HARGA SATUAN BARANG": "number",
                        "HARGA TOTAL BARANG": "number",
                        "USER INPUT": "",
                        "STATUS POST": "string"
                    };
                    if (data.length === 0) {
                        var _item = {
                            "NOMOR PO EXTERNAL": "",
                            "TANGGAL PO EXTERNAL": "",
                            "KODE SUPPLIER": "",
                            "NAMA SUPPLIER": "",
                            "DELIVERY": "",
                            "ONGKIR": "",
                            "PAYMENT": "",
                            "TEMPO": "",
                            "MATA UANG": "",
                            "RATE": "",
                            "PPN": "",
                            "PPH": "",
                            "% PPH": "",
                            "KETERANGAN": "",
                            "NOMOR PURCHASE REQUEST": "",
                            "KODE BARANG": "",
                            "NAMA BARANG": "",
                            "JUMLAH BARANG": "",
                            "SATUAN BARANG": "",
                            "HARGA SATUAN BARANG": "",
                            "HARGA TOTAL BARANG": "",
                            "USER INPUT": "",
                            "STATUS POST": ""
                        }
                        data.push(_item);
                    }
                    if (dateFrom && dateTo) {
                        response.xls(`Laporan PO Eksternal -  ${moment(new Date(dateFrom)).format("DD MMM YYYY")} -  ${moment(new Date(dateTo)).format("DD MMM YYYY")}.xlsx`, data, options);
                    } else {
                        response.xls(`Laporan PO Eksternal -  ${moment(new Date()).add(offset, 'h').format("DD MMM YYYY")}.xlsx`, data, options);
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
