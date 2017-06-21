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
            var budgetId = request.params.budgetId;
            var staffName = request.params.staffName;
            var productName = request.params.productName;
            var createdBy = "";

            manager.getPrice(unitId, categoryId, PODLNo, PRNo, supplierId, dateFrom, dateTo, state, budgetId, staffName, createdBy, productName)
                .then(docs => {

                    var dateFormat = "DD/MM/YYYY";
                    var dateFormat2 = "DD MMM YYYY";
                    var locale = 'id-ID';
                    var moment = require('moment');
                    moment.locale(locale);

                    var data = [];
                    var index = 0;
                    for (var PO of docs) {
                            if ( PO.items.fulfillments.length > 0) {
                                for (var fulfillment of PO.items.fulfillments) {
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
                                            _correctionDate = `${_correctionDate}${i}. ${moment(new Date(correction.correctionDate)).format(dateFormat)}\n`;
                                            _correctionRemark = `${_correctionRemark}${i}. ${correction.correctionRemark}\n`;
                                            i++;
                                        }
                                    }

                                    var _item = {
                                        "No": index,
                                        "Tanggal Purchase Request": moment(new Date(PO.purchaseRequest.date)).format(dateFormat),
                                        "No Purchase Request": PO.purchaseRequest.no,
                                        "Kategori": PO.category.name,
                                        "Budget": PO.purchaseRequest.budget.name,
                                        "Nama Barang": PO.items.product.name,
                                        "Kode Barang": PO.items.product.code,
                                        "Jumlah Barang": PO.items.dealQuantity ? PO.items.dealQuantity : 0,
                                        "Satuan Barang": PO.items.dealUom.unit ? PO.items.dealUom.unit : "-",
                                        "Harga Barang": PO.purchaseOrderExternal ? (PO.items.pricePerDealUnit * PO.purchaseOrderExternal.currencyRate) : 0,
                                        "Harga Total": PO.purchaseOrderExternal ? (PO.items.pricePerDealUnit * PO.items.dealQuantity * PO.purchaseOrderExternal.currencyRate) : 0,
                                        "Kode Supplier": PO.supplier.code ? PO.supplier.code : "-",
                                        "Nama Supplier": PO.supplier.name ? PO.supplier.name : "-",
                                        "Tanggal Terima PO Internal": moment(new Date(PO._createdDate)).format(dateFormat),
                                        "Tanggal Terima PO Eksternal": PO.purchaseOrderExternal.date ? moment(new Date(PO.purchaseOrderExternal.date)).format(dateFormat) : "-",
                                        "Tanggal Target Datang": PO.purchaseOrderExternal.expectedDeliveryDate ? moment(new Date(PO.purchaseOrderExternal.expectedDeliveryDate)).format(dateFormat) : "-",
                                        "No PO Eksternal": PO.purchaseOrderExternal.no ? PO.purchaseOrderExternal.no : "-",
                                        "Tanggal Surat Jalan": fulfillment.supplierDoDate ? moment(new Date(fulfillment.supplierDoDate)).format(dateFormat) : "-",
                                        "Tanggal Datang Barang": fulfillment.deliveryOrderDate ? moment(new Date(fulfillment.deliveryOrderDate)).format(dateFormat) : "-",
                                        "No Surat Jalan": fulfillment.deliveryOrderNo ? fulfillment.deliveryOrderNo : "-",
                                        "Tanggal Bon Terima Unit": fulfillment.unitReceiptNoteDate ? moment(new Date(fulfillment.unitReceiptNoteDate)).format(dateFormat) : "-",
                                        "No Bon Terima Unit": fulfillment.unitReceiptNoteNo ? fulfillment.unitReceiptNoteNo : "-",
                                        "Jumlah Diminta": fulfillment.unitReceiptNoteDeliveredQuantity ? fulfillment.unitReceiptNoteDeliveredQuantity : 0,
                                        "Satuan Diminta": fulfillment.unitReceiptDeliveredUom ? fulfillment.unitReceiptDeliveredUom.unit : "-",
                                        "Tempo Pembayaran": PO.paymentDueDays,
                                        "Tanggal Invoice": fulfillment.invoiceDate ? moment(new Date(fulfillment.invoiceDate)).format(dateFormat) : "-",
                                        "No Invoice": fulfillment.invoiceNo ? fulfillment.invoiceNo : "-",
                                        "Tanggal Nota Intern": fulfillment.interNoteDate ? moment(new Date(fulfillment.interNoteDate)).format(dateFormat) : "-",
                                        "No Nota Intern": fulfillment.interNoteNo ? fulfillment.interNoteNo : "-",
                                        "Nilai Nota Intern": fulfillment.interNoteValue ? fulfillment.interNoteValue : 0,
                                        "Tanggal Jatuh Tempo": fulfillment.interNoteDueDate ? moment(new Date(fulfillment.interNoteDueDate)).format(dateFormat) : "-",
                                        "Tanggal PPN": fulfillment.ppnDate ? moment(new Date(fulfillment.ppnDate)).format(dateFormat) : "-",
                                        "No PPN": fulfillment.ppnNo ? fulfillment.ppnNo : "-",
                                        "Nilai PPN": fulfillment.ppnValue ? fulfillment.ppnValue : 0,
                                        "Tanggal PPH": fulfillment.pphDate ? moment(new Date(fulfillment.pphDate)).format(dateFormat) : "-",
                                        "No PPH": fulfillment.pphNo ? fulfillment.pphNo : "-",
                                        "Nilai PPH": fulfillment.pphValue ? fulfillment.pphValue : 0,
                                        "Tanggal Koreksi": _correctionDate || "-",
                                        "No Koreksi": _correctionNo || "-",
                                        "Nilai Koreksi": _correctionPriceTotal || 0,
                                        "Ket. Koreksi": _correctionRemark || "-",
                                        "Keterangan": PO.purchaseOrderExternal.remark ? PO.purchaseOrderExternal.remark : "-",
                                        "Status": PO.status ? PO.status.label : "-",
                                        "Staff Pembelian": PO._createdBy,
                                        "Mata Uang": PO.currency.symbol
                                  }
                                    data.push(_item);
                                }
                            }
                            else {
                                index++;
                                var _item = {
                                    "No": index,
                                    "Tanggal Purchase Request": moment(new Date(PO.purchaseRequest.date)).format(dateFormat),
                                    "No Purchase Request": PO.purchaseRequest.no,
                                    "Kategori": PO.category.name,
                                    "Budget": PO.purchaseRequest.budget.name,
                                    "Nama Barang": PO.items.product.name,
                                    "Kode Barang": PO.items.product.code,
                                    "Jumlah Barang": PO.items.dealQuantity ? PO.items.dealQuantity : 0,
                                    "Satuan Barang": PO.items.dealUom.unit ? PO.items.dealUom.unit : "-",
                                    "Harga Barang": PO.purchaseOrderExternal.currencyRate ? (PO.items.pricePerDealUnit * PO.purchaseOrderExternal.currencyRate) : 0,
                                    "Harga Total": PO.purchaseOrderExternal.currencyRate ? (PO.items.pricePerDealUnit * PO.items.dealQuantity * PO.purchaseOrderExternal.currencyRate) : 0,
                                    "Kode Supplier": PO.supplier.code ? PO.supplier.code : "-",
                                    "Nama Supplier": PO.supplier.name ? PO.supplier.name : "-",
                                    "Tanggal Terima PO Internal": moment(new Date(PO._createdDate)).format(dateFormat),
                                    "Tanggal Terima PO Eksternal": PO.purchaseOrderExternal.date ? moment(new Date(PO.purchaseOrderExternal.date)).format(dateFormat) : "-",
                                    "Tanggal Target Datang": PO.purchaseOrderExternal.expectedDeliveryDate ? moment(new Date(PO.purchaseOrderExternal.expectedDeliveryDate)).format(dateFormat) : "-",
                                    "No PO Eksternal": PO.purchaseOrderExternal.no,
                                    "Tanggal Surat Jalan": "-",
                                    "Tanggal Datang Barang": "-",
                                    "No Surat Jalan": "-",
                                    "Tanggal Bon Terima Unit": "-",
                                    "No Bon Terima Unit": "-",
                                    "Jumlah Diminta": 0,
                                    "Satuan Diminta": "-",
                                    "Tempo Pembayaran": PO.paymentDueDays,
                                    "Tanggal Invoice": "-",
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
                                    "Status": PO.status ? PO.status.label : "-",
                                    "Staff Pembelian": PO._createdBy,
                                    "Mata Uang": PO.currency.symbol
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
                            "No": "number",
                            "Tgl. PO": "string",
                            "No. PO": "string",
                            "Supplier": "string",
                            "Tgl. invoice": "string",
                            "No. invoice": "string",
                            "Jumlah": "number",
                            "Satuan": "string",
                            "Harga": "number",
                            "Mata Uang": "string"

                    };


                        response.xls(`Laporan History Harga Barang - ${moment(new Date()).format(dateFormat2)}.xlsx`, data, options);
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