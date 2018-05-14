var Router = require('restify-router').Router;
var db = require("../../../db");
var UnitPaymentOrderManager = require("dl-module").managers.purchasing.UnitPaymentOrderManager;
var resultFormatter = require("../../../result-formatter");
var ObjectId = require("mongodb").ObjectId;
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get('/', passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new UnitPaymentOrderManager(db, request.user);

            var dateFormat = "DD/MM/YYYY";
            var locale = 'id-ID';
            var moment = require('moment');
            moment.locale(locale);
            var dateFrom = request.params.dateFrom;
            var dateTo = request.params.dateTo;
            var filter = {};
            if (dateFrom && dateTo) {
                filter = {
                    date: {
                        $gte: new Date(dateFrom),
                        $lte: new Date(dateTo)
                    }
                };
            }

            manager.getAllData(filter)
                .then(list => {
                    var data = [];
                    for (var _data of list) {
                        for (var _items of _data.items) {
                            for (var _unitReceiptNoteItem of _items.unitReceiptNote.items) {
                                var useIncomeTax = false;
                                for (var poItem of _unitReceiptNoteItem.purchaseOrder.items) {
                                    if (poItem.product._id.toString() === _unitReceiptNoteItem.product._id.toString()) {
                                        useIncomeTax = poItem.useIncomeTax;
                                        break;
                                    }
                                }
                                var _item = {
                                    "NOMOR NOTA KREDIT": _data.no,
                                    "TANGGAL NOTA KREDIT": moment(new Date(_data.date)).format(dateFormat),
                                    "KODE SUPPLIER": _data.supplier.code,
                                    "NAMA SUPPLIER": _data.supplier.name,
                                    "KATEGORI": _data.category.name,
                                    "NOMOR INVOICE": _data.invoceNo,
                                    "TANGGAL INVOICE": moment(new Date(_data.invoceDate)).format(dateFormat),
                                    "TANGGAL JATUH TEMPO": moment(new Date(_data.dueDate)).format(dateFormat),
                                    "KETERANGAN": _data.remark,
                                    "PPN": _data.useIncomeTax ? "Ya" : "Tidak",
                                    "NOMOR FAKTUR PAJAK": _data.useIncomeTax ? _data.incomeTaxNo : "",
                                    "TANGGAL FAKTUR PAJAK": _data.useIncomeTax ? moment(new Date(_data.incomeTaxDate)).format(dateFormat) : "",
                                    "PPH": _data.useVat ? "Ya" : "Tidak",
                                    "JENIS PPH": _data.useVat ? _data.vat.name : "",
                                    "% PPH": _data.useVat ? _data.vat.rate : "",
                                    "NOMOR FAKTUR PPH": _data.useVat ? _data.vatNo : "",
                                    "TANGGAL FAKTUR PPH": _data.useVat ? moment(new Date(_data.vatDate)).format(dateFormat) : "",
                                    "NOMOR PO EXTERNAL": _unitReceiptNoteItem.purchaseOrder.purchaseOrderExternal.no,
                                    "NOMOR PURCHASE REQUEST": _unitReceiptNoteItem.purchaseOrder.purchaseRequest.no,
                                    "NOMOR ACCOUNT": "",
                                    "KODE BARANG": _unitReceiptNoteItem.product.code,
                                    "NAMA BARANG": _unitReceiptNoteItem.product.name,
                                    "JUMLAH BARANG": _unitReceiptNoteItem.deliveredQuantity,
                                    "SATUAN BARANG": _unitReceiptNoteItem.deliveredUom.unit,
                                    "HARGA SATUAN BARANG": _unitReceiptNoteItem.pricePerDealUnit,
                                    "INCLUDED PPN (Y/N)": useIncomeTax ? "Ya" : "Tidak",
                                    "MATA UANG": _unitReceiptNoteItem.currency.code,
                                    "RATE": _unitReceiptNoteItem.currency.rate,
                                    "HARGA TOTAL BARANG": _unitReceiptNoteItem.pricePerDealUnit * _unitReceiptNoteItem.deliveredQuantity,
                                    "NOMOR BON TERIMA UNIT": _items.unitReceiptNote.no,
                                    "TANGGAL BON TERIMA UNIT": moment(new Date(_items.unitReceiptNote.date)).format(dateFormat),
                                    "PRINTED_FLAG": "",
                                    "USER INPUT": _data._createdBy
                                }
                                data.push(_item);
                            }
                        }
                    }
                    var options = {
                        "NOMOR NOTA KREDIT": "string",
                        "TANGGAL NOTA KREDIT": "date",
                        "KODE SUPPLIER": "string",
                        "NAMA SUPPLIER": "string",
                        "KATEGORI": "string",
                        "NOMOR INVOICE": "string",
                        "TANGGAL INVOICE    ": "date",
                        "TANGGAL JATUH TEMPO": "date",
                        "KETERANGAN": "string",
                        "PPN": "string",
                        "NOMOR FAKTUR PAJAK": "string",
                        "TANGGAL FAKTUR PAJAK": "date",
                        "PPH": "string",
                        "JENIS PPH": "string",
                        "% PPH": "string",
                        "NOMOR FAKTUR PPH": "string",
                        "TANGGAL FAKTUR PPH": "date",
                        "NOMOR PO EXTERNAL": "string",
                        "NOMOR PURCHASE REQUEST": "string",
                        "NOMOR ACCOUNT": "string",
                        "KODE BARANG": "string",
                        "NAMA BARANG": "string",
                        "JUMLAH BARANG": "number",
                        "SATUAN BARANG": "string",
                        "HARGA SATUAN BARANG": "number",
                        "INCLUDED PPN (Y/N)": "string",
                        "MATA UANG": "string",
                        "RATE": "number",
                        "HARGA TOTAL BARANG": "number",
                        "NOMOR BON TERIMA UNIT": "string",
                        "TANGGAL BON TERIMA UNIT": "date",
                        "PRINTED_FLAGT": "string",
                        "USER INPUT": ""
                    };
                    if (data.length === 0) {
                        var _item = {
                            "NOMOR NOTA KREDIT": "",
                            "TANGGAL NOTA KREDIT": "",
                            "KODE SUPPLIER": "",
                            "NAMA SUPPLIER": "",
                            "KATEGORI": "",
                            "NOMOR INVOICE": "",
                            "TANGGAL INVOICE": "",
                            "TANGGAL JATUH TEMPO": "",
                            "KETERANGAN": "",
                            "PPN": "",
                            "NOMOR FAKTUR PAJAK": "",
                            "TANGGAL FAKTUR PAJAK": "",
                            "PPH": "",
                            "JENIS PPH": "",
                            "% PPH": "",
                            "NOMOR FAKTUR PPH": "",
                            "TANGGAL FAKTUR PPH": "",
                            "NOMOR PO EXTERNAL": "",
                            "NOMOR PURCHASE REQUEST": "",
                            "NOMOR ACCOUNT": "",
                            "KODE BARANG": "",
                            "NAMA BARANG": "",
                            "JUMLAH BARANG": "",
                            "SATUAN BARANG": "",
                            "HARGA SATUAN BARANG": "",
                            "INCLUDED PPN (Y/N)": "",
                            "MATA UANG": "",
                            "RATE": "",
                            "HARGA TOTAL BARANG": "",
                            "NOMOR BON TERIMA UNIT": "",
                            "TANGGAL BON TERIMA UNIT": "",
                            "PRINTED_FLAG": "",
                            "USER INPUT": ""
                        }
                        data.push(_item);
                    }
                    if (dateFrom && dateTo) {
                        response.xls(`Laporan Nota Kredit -  ${moment(new Date(dateFrom)).format("DD MMM YYYY")} -  ${moment(new Date(dateTo)).format("DD MMM YYYY")}.xlsx`, data, options);
                    } else {
                        response.xls(`Laporan Nota Kredit -  ${moment(new Date()).format("DD MMM YYYY")}.xlsx`, data, options);
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

