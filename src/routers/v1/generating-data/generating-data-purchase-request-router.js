var Router = require('restify-router').Router;
var db = require("../../../db");
var PurchaseOrderManager = require("dl-module").managers.purchasing.PurchaseOrderManager;
var PurchaseRequestManager = require("dl-module").managers.purchasing.PurchaseRequestManager;
var resultFormatter = require("../../../result-formatter");
var ObjectId = require("mongodb").ObjectId;
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get('/', passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new PurchaseRequestManager(db, request.user);
            var poManager = new PurchaseOrderManager(db, request.user);

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
                    _createdDate: {
                        $gte: qDateFrom,
                        $lte: qDateTo
                    }
                };
            }

            manager.getAllDataPR(filter)
                .then(purchaseRequests => {
                    var data = [];
                    var taskPO = [];
                    for (var _purchaseRequest of purchaseRequests) {
                        if (_purchaseRequest.isUsed) {
                            taskPO.push(poManager.selectDateById(_purchaseRequest._id));
                        }
                    }
                    Promise.all(taskPO)
                        .then(poInternals => {
                            for (var purchaseRequest of purchaseRequests) {
                                var poInternalDate = "";
                                if (purchaseRequest.isUsed) {
                                    for (var poInternal of poInternals) {
                                        if (purchaseRequest._id && poInternal.purchaseRequest) {
                                            if (purchaseRequest._id.toString() === poInternal.purchaseRequest._id.toString()) {
                                                poInternalDate = moment(new Date(poInternal._createdDate)).add(offset, 'h').format(dateFormat);
                                                break;
                                            }
                                        }
                                    }
                                }
                                for (var item of purchaseRequest.items) {
                                    var _item = {
                                        "NOMOR PURCHASE REQUEST": purchaseRequest.no,
                                        "TANGGAL PURCHASE REQUEST": moment(new Date(purchaseRequest.date)).add(offset, 'h').format(dateFormat),
                                        "TANGGAL DIMINTA": moment(new Date(purchaseRequest.expectedDeliveryDate)).add(offset, 'h').format(dateFormat),
                                        "TANGGAL TERIMA PR": poInternalDate,
                                        "KODE BUDGET": purchaseRequest.budget.code,
                                        "BAGIAN / UNIT": purchaseRequest.unit.division.name + " - " + purchaseRequest.unit.name,
                                        "KODE KATEGORI": purchaseRequest.category.code,
                                        "KETERANGAN": purchaseRequest.remark,
                                        "KODE BARANG": item.product.code,
                                        "NAMA BARANG": item.product.name,
                                        "JUMLAH BARANG": item.quantity,
                                        "SATUAN BARANG": item.product.uom.unit,
                                        "KETERANGAN BARANG": item.remark,
                                        "USER INPUT": purchaseRequest._createdBy,
                                        "STATUS POST": purchaseRequest.isPosted ? "Sudah diposting" : "Belum diposting"
                                    }
                                    data.push(_item);
                                }
                            }
                            var options = {
                                "NOMOR PURCHASE REQUEST": "string",
                                "TANGGAL PURCHASE REQUEST": "date",
                                "TANGGAL DIMINTA": "date",
                                "TANGGAL TERIMA PR": "date",
                                "KODE BUDGET": "string",
                                "BAGIAN / UNIT": "string",
                                "KODE KATEGORI": "string",
                                "KETERANGAN": "string",
                                "KODE BARANG": "string",
                                "NAMA BARANG": "string",
                                "JUMLAH BARANG": "number",
                                "SATUAN BARANG": "string",
                                "KETERANGAN BARANG": "string",
                                "USER INPUT": "",
                                "STATUS POST": "string"
                            };
                            if (data.length === 0) {
                                var _item = {
                                    "NOMOR PURCHASE REQUEST": "",
                                    "TANGGAL PURCHASE REQUEST": "",
                                    "TANGGAL DIMINTA": "",
                                    "KODE BUDGET": "",
                                    "BAGIAN / UNIT": "",
                                    "KODE KATEGORI": "",
                                    "KETERANGAN": "",
                                    "KODE BARANG": "",
                                    "NAMA BARANG": "",
                                    "JUMLAH BARANG": "",
                                    "SATUAN BARANG": "",
                                    "USER INPUT": "",
                                    "STATUS POST": ""
                                }
                                data.push(_item);
                            }
                            if (dateFrom && dateTo) {
                                response.xls(`Laporan Purchase Request -  ${moment(new Date(dateFrom)).format("DD MMM YYYY")} -  ${moment(new Date(dateTo)).format("DD MMM YYYY")}.xlsx`, data, options);
                            } else {
                                response.xls(`Laporan Purchase Request -  ${moment(new Date()).add(offset, 'h').format("DD MMM YYYY")}.xlsx`, data, options);
                            }
                        })
                        .catch(e => {
                            var error = resultFormatter.fail(apiVersion, 400, e);
                            response.send(400, error);
                        })
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

