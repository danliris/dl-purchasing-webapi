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
            manager.getDataPOMonitoringPembelian(unitId, categoryId, PODLNo, PRNo, supplierId, dateFrom, dateTo, state, budgetId, "", offset, createdBy)
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
                                        "No": index,
                                        "Tanggal Purchase Request": moment(new Date(PO.purchaseRequest.date)).add(offset, 'h').format(dateFormat),
                                        "Tanggal Pembuatan PR": moment(new Date(PO.purchaseRequest._createdDate)).add(offset, 'h').format(dateFormat),
                                        "Tanggal Diminta Datang PR": moment(new Date(PO.purchaseRequest.expectedDeliveryDate)).add(offset, 'h').format(dateFormat),                                        
                                        "No Purchase Request": PO.purchaseRequest.no,
                                        "Kategori": PO.category.name,
                                        "Budget": PO.purchaseRequest.budget.name,
                                        "Nama Barang": item.product.name,
                                        "Kode Barang": item.product.code,
                                        "Jumlah Barang": item.dealQuantity ? item.dealQuantity : 0,
                                        "Satuan Barang": item.dealUom.unit ? item.dealUom.unit : "-",
                                        "Harga Barang": PO.purchaseOrderExternal ? (item.pricePerDealUnit * PO.purchaseOrderExternal.currencyRate) : 0,
                                        "Harga Total": PO.purchaseOrderExternal ? (item.pricePerDealUnit * item.dealQuantity * PO.purchaseOrderExternal.currencyRate) : 0,
                                        "Kode Supplier": PO.supplier.code ? PO.supplier.code : "-",
                                        "Nama Supplier": PO.supplier.name ? PO.supplier.name : "-",
                                        "Tanggal Terima PO Internal": moment(new Date(PO._createdDate)).add(offset, 'h').format(dateFormat),
                                        "Tanggal Terima PO Eksternal": PO.purchaseOrderExternal.date ? moment(new Date(PO.purchaseOrderExternal.date)).add(offset, 'h').format(dateFormat) : "-",
                                        "Tanggal Pembuatan PO Eksternal": PO.purchaseOrderExternal._createdDate ? moment(new Date(PO.purchaseOrderExternal._createdDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "Tanggal Target Datang": PO.purchaseOrderExternal.expectedDeliveryDate ? moment(new Date(PO.purchaseOrderExternal.expectedDeliveryDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "No PO Eksternal": PO.purchaseOrderExternal.no ? PO.purchaseOrderExternal.no : "-",
                                        "Tanggal Surat Jalan": fulfillment.supplierDoDate ? moment(new Date(fulfillment.supplierDoDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "Tanggal Datang Barang": fulfillment.deliveryOrderDate ? moment(new Date(fulfillment.deliveryOrderDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "No Surat Jalan": fulfillment.deliveryOrderNo ? fulfillment.deliveryOrderNo : "-",
                                        "Tanggal Bon Terima Unit": fulfillment.unitReceiptNoteDate ? moment(new Date(fulfillment.unitReceiptNoteDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "No Bon Terima Unit": fulfillment.unitReceiptNoteNo ? fulfillment.unitReceiptNoteNo : "-",
                                        "Jumlah Diminta": fulfillment.unitReceiptNoteDeliveredQuantity ? fulfillment.unitReceiptNoteDeliveredQuantity : 0,
                                        "Satuan Diminta": fulfillment.unitReceiptDeliveredUom ? fulfillment.unitReceiptDeliveredUom.unit : "-",
                                        "Tempo Pembayaran": PO.paymentDueDays,
                                        "Tanggal Invoice": fulfillment.invoiceDate ? moment(new Date(fulfillment.invoiceDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "No Invoice": fulfillment.invoiceNo ? fulfillment.invoiceNo : "-",
                                        "Tanggal Nota Intern": fulfillment.interNoteDate ? moment(new Date(fulfillment.interNoteDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "No Nota Intern": fulfillment.interNoteNo ? fulfillment.interNoteNo : "-",
                                        "Nilai Nota Intern": fulfillment.interNoteValue ? fulfillment.interNoteValue : 0,
                                        "Tanggal Jatuh Tempo": fulfillment.interNoteDueDate ? moment(new Date(fulfillment.interNoteDueDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "Tanggal PPN": fulfillment.ppnDate ? moment(new Date(fulfillment.ppnDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "No PPN": fulfillment.ppnNo ? fulfillment.ppnNo : "-",
                                        "Nilai PPN": fulfillment.ppnValue ? fulfillment.ppnValue : 0,
                                        "Tanggal PPH": fulfillment.pphDate ? moment(new Date(fulfillment.pphDate)).add(offset, 'h').format(dateFormat) : "-",
                                        "No PPH": fulfillment.pphNo ? fulfillment.pphNo : "-",
                                        "Nilai PPH": fulfillment.pphValue ? fulfillment.pphValue : 0,
                                        "Tanggal Koreksi": _correctionDate || "-",
                                        "No Koreksi": _correctionNo || "-",
                                        "Nilai Koreksi": _correctionPriceTotal || 0,
                                        "Ket. Koreksi": _correctionRemark || "-",
                                        "Keterangan": PO.purchaseOrderExternal.remark ? PO.purchaseOrderExternal.remark : "-",
                                        "Status": PO.status ? PO.status.label : "-"
                                    }
                                    data.push(_item);
                                }
                            }
                            else {
                                index++;
                                var _item = {
                                    "No": index,
                                    "Tanggal Purchase Request": moment(new Date(PO.purchaseRequest.date)).add(offset, 'h').format(dateFormat),
                                    "Tanggal Pembuatan PR": moment(new Date(PO.purchaseRequest._createdDate)).add(offset, 'h').format(dateFormat),
                                    "Tanggal Diminta Datang PR": moment(new Date(PO.purchaseRequest.expectedDeliveryDate)).add(offset, 'h').format(dateFormat),                                        
                                    "No Purchase Request": PO.purchaseRequest.no,
                                    "Kategori": PO.category.name,
                                    "Budget": PO.purchaseRequest.budget.name,
                                    "Nama Barang": item.product.name,
                                    "Kode Barang": item.product.code,
                                    "Jumlah Barang": item.dealQuantity ? item.dealQuantity : 0,
                                    "Satuan Barang": item.dealUom.unit ? item.dealUom.unit : "-",
                                    "Harga Barang": PO.purchaseOrderExternal.currencyRate ? (item.pricePerDealUnit * PO.purchaseOrderExternal.currencyRate) : 0,
                                    "Harga Total": PO.purchaseOrderExternal.currencyRate ? (item.pricePerDealUnit * item.dealQuantity * PO.purchaseOrderExternal.currencyRate) : 0,
                                    "Kode Supplier": PO.supplier.code ? PO.supplier.code : "-",
                                    "Nama Supplier": PO.supplier.name ? PO.supplier.name : "-",
                                    "Tanggal Terima PO Internal": moment(new Date(PO._createdDate)).add(offset, 'h').format(dateFormat),
                                    "Tanggal Terima PO Eksternal": PO.purchaseOrderExternal.date ? moment(new Date(PO.purchaseOrderExternal.date)).add(offset, 'h').format(dateFormat) : "-",
                                    "Tanggal Pembuatan PO Eksternal": PO.purchaseOrderExternal._createdDate ? moment(new Date(PO.purchaseOrderExternal._createdDate)).add(offset, 'h').format(dateFormat) : "-",
                                    "Tanggal Target Datang": PO.purchaseOrderExternal.expectedDeliveryDate ? moment(new Date(PO.purchaseOrderExternal.expectedDeliveryDate)).add(offset, 'h').format(dateFormat) : "-",
                                    "No PO Eksternal": PO.purchaseOrderExternal.no,
                                    "Tanggal Surat Jalan": "-",
                                    "Tanggal Datang Barang": "-",
                                    "No Surat Jalan": "-",
                                    "Tanggal Bon Terima Unit": "-",
                                    "No Bon Terima Unit": "-",
                                    "Jumlah Diminta": 0,
                                    "Satuan Diminta": "-",
                                    "Tanggal Invoice": "-",
                                    "Tempo Pembayaran": PO.paymentDueDays,
                                    "No Invoice": "-",
                                    "Tanggal Nota Intern": "-",
                                    "No Nota Intern": "-",
                                    "Nilai Nota Intern": 0,
                                    "Tanggal Jatuh Tempo": "-",
                                    "Tanggal PPN": "-",
                                    "No PPN": "-",
                                    "Nilai PPN": 0,
                                    "Tanggal PPH": "-",
                                    "No PPH": "-",
                                    "Nilai PPH": 0,
                                    "Tanggal Koreksi": "-",
                                    "No Koreksi": "-",
                                    "Nilai Koreksi": 0,
                                    "Ket. Koreksi": "-",
                                    "Keterangan": PO.purchaseOrderExternal.remark ? PO.purchaseOrderExternal.remark : "-",
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
                            "No": "number",
                            "Tanggal Purchase Request": "string",
                            "Tanggal Pembuatan PR": "string",
                            "Tanggal Diminta Datang PR": "string",                                        
                            "No Purchase Request": "string",
                            "Kategori": "string",
                            "Budget": "string",
                            "Nama Barang": "string",
                            "Kode Barang": "string",
                            "Jumlah Barang": "number",
                            "Satuan Barang": "string",
                            "Harga Barang": "number",
                            "Harga Total": "number",
                            "Kode Supplier": "string",
                            "Nama Supplier": "string",
                            "Tanggal Terima PO Internal": "string",
                            "Tanggal Terima PO Eksternal": "string",
                            "Tanggal Target Datang": "string",
                            "No PO Eksternal": "string",
                            "Tanggal Surat Jalan": "string",
                            "Tanggal Datang Barang": "string",
                            "No Surat Jalan": "string",
                            "Tanggal Bon Terima Unit": "string",
                            "No Bon Terima Unit": "string",
                            "Jumlah Diminta": "number",
                            "Satuan Diminta": "string",
                            "Tempo Pembayaran": "string",
                            "Tanggal Invoice": "string",
                            "No Invoice": "string",
                            "Tanggal Nota Intern": "string",
                            "No Nota Intern": "string",
                            "Nilai Nota Intern": "number",
                            "Tanggal Jatuh Tempo": "string",
                            "Tanggal PPN": "string",
                            "No PPN": "string",
                            "Nilai PPN": "number",
                            "Tanggal PPH": "string",
                            "No PPH": "string",
                            "Nilai PPH": "string",
                            "Keterangan": "string",
                            "Status": "string"
                        };


                        response.xls(`Laporan Monitoring Pembelian - ${moment(new Date()).add(offset, 'h').format(dateFormat2)}.xlsx`, data, options);
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