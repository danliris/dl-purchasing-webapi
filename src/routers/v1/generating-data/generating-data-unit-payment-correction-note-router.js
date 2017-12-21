var Router = require('restify-router').Router;
var db = require("../../../db");
var UnitPaymentPriceCorrectionNoteManager = require("dl-module").managers.purchasing.UnitPaymentPriceCorrectionNoteManager;
var resultFormatter = require("../../../result-formatter");
var ObjectId = require("mongodb").ObjectId;
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get('/', passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new UnitPaymentPriceCorrectionNoteManager(db, request.user);

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
                        for (var item of _data.items) {
                            var unitReceiptNote = {};
                            for (var unitPaymentOrderItems of _data.unitPaymentOrder.items) {
                                for (var unitReceiptnoteItem of unitPaymentOrderItems.unitReceiptNote.items) {
                                    if (unitReceiptnoteItem.purchaseOrder._id.toString() === item.purchaseOrder._id.toString()) {
                                        unitReceiptNote = {
                                            no: unitPaymentOrderItems.unitReceiptNote.no,
                                            date: unitPaymentOrderItems.unitReceiptNote.date
                                        };
                                        break;
                                    }
                                }
                                if (unitReceiptNote) {
                                    break;
                                }
                            }
                            var _item = {
                                "NOMOR NOTA KOREKSI": _data.no,
                                "TANGGAL NOTA KOREKSI": moment(new Date(_data.date)).format(dateFormat),
                                "JENIS RETUR": _data.correctionType,
                                "NOMOR NOTA KREDIT": _data.unitPaymentOrder.no,
                                "NOMOR INVOICE KOREKSI": _data.invoiceCorrectionNo,
                                "TANGGAL INVOICE KOREKSI": moment(new Date(_data.invoiceCorrectionDate)).format(dateFormat),
                                "FAKTUR PAJAK KOREKSI PPN ": _data.incomeTaxCorrectionNo,
                                "TANGGAL FAKTUR PAJAK KOREKSI PPN ": _data.incomeTaxCorrectionNo.length > 0 ? moment(new Date(_data.incomeTaxCorrectionDate)).format(dateFormat) : "",
                                "FAKTUR PAJAK KOREKSI PPH": _data.vatTaxCorrectionNo,
                                "TANGGAL FAKTUR PAJAK KOREKSI PPH ": _data.vatTaxCorrectionNo.length > 0 ? moment(new Date(_data.vatTaxCorrectionDate)).format(dateFormat) : "",
                                "KODE SUPPLIER": _data.unitPaymentOrder.supplier.code,
                                "NAMA SUPPLIER": _data.unitPaymentOrder.supplier.name,
                                "ALAMAT SUPPLIER": _data.unitPaymentOrder.supplier.address,
                                "NOMOR SURAT PENGANTAR": _data.releaseOrderNoteNo,
                                "KETERANGAN": _data.remark,
                                "NOMOR PO EXTERNAL": item.purchaseOrder.purchaseOrderExternal.no,
                                "NOMOR PURCHASE REQUEST": item.purchaseOrder.purchaseRequest.no,
                                "NOMOR ACCOUNT": "",
                                "KODE BARANG": item.product.code,
                                "NAMA BARANG": item.product.name,
                                "JUMLAH BARANG": item.quantity,
                                "SATUAN BARANG": item.uom.unit,
                                "HARGA SATUAN BARANG": item.pricePerUnit,
                                "MATA UANG": item.currency.code,
                                "RATE": item.currency.rate,
                                "HARGA TOTAL BARANG": item.priceTotal,
                                "NOMOR BON TERIMA UNIT": unitReceiptNote.no,
                                "TANGGAL BON TERIMA UNIT": moment(new Date(unitReceiptNote.date)).format(dateFormat),
                                "USER INPUT": _data._createdBy,
                                "PPN": _data.useIncomeTax ? "Ya" : "Tidak",
                                "PPH": _data.useVat ? "Ya" : "Tidak"
                            }
                            data.push(_item);
                        }
                    }
                    var options = {
                        "NOMOR NOTA KOREKSI": "string",
                        "TANGGAL NOTA KOREKSI": "date",
                        "JENIS RETUR": "string",
                        "NOMOR NOTA KREDIT": "string",
                        "NOMOR INVOICE KOREKSI": "string",
                        "TANGGAL INVOICE KOREKSI": "date",
                        "FAKTUR PAJAK KOREKSI PPN ": "string",
                        "TANGGAL FAKTUR PAJAK KOREKSI PPN ": "date",
                        "FAKTUR PAJAK KOREKSI PPH": "string",
                        "TANGGAL FAKTUR PAJAK KOREKSI PPH": "date",
                        "KODE SUPPLIER": "string",
                        "NAMA SUPPLIER": "string",
                        "ALAMAT SUPPLIER": "string",
                        "NOMOR SURAT PENGANTAR": "string",
                        "KETERANGAN": "string",
                        "NOMOR PO EXTERNAL": "string",
                        "NOMOR PURCHASE REQUEST": "string",
                        "NOMOR ACCOUNT": "string",
                        "KODE BARANG": "string",
                        "NAMA BARANG": "string",
                        "JUMLAH BARANG": "number",
                        "SATUAN BARANG": "string",
                        "HARGA SATUAN BARANG": "number",
                        "MATA UANG": "string",
                        "RATE": "number",
                        "HARGA TOTAL BARANG": "number",
                        "NOMOR BON TERIMA UNIT": "string",
                        "TANGGAL BON TERIMA UNIT": "date",
                        "USER INPUT": "",
                        "PPN": "string",
                        "PPH": "string"
                    };

                    if (data.length === 0) {
                        var _item = {
                            "NOMOR NOTA KOREKSI": "",
                            "TANGGAL NOTA KOREKSI": "",
                            "JENIS RETUR": "",
                            "NOMOR NOTA KREDIT": "",
                            "NOMOR INVOICE KOREKSI": "",
                            "TANGGAL INVOICE KOREKSI": "",
                            "FAKTUR PAJAK KOREKSI PPN ": "",
                            "TANGGAL FAKTUR PAJAK KOREKSI PPN ": "",
                            "FAKTUR PAJAK KOREKSI PPH": "",
                            "TANGGAL FAKTUR PAJAK KOREKSI PPH ": "",
                            "KODE SUPPLIER": "",
                            "NAMA SUPPLIER": "",
                            "ALAMAT SUPPLIER": "",
                            "NOMOR SURAT PENGANTAR": "",
                            "KETERANGAN": "",
                            "NOMOR PO EXTERNAL": "",
                            "NOMOR PURCHASE REQUEST": "",
                            "NOMOR ACCOUNT": "",
                            "KODE BARANG": "",
                            "NAMA BARANG": "",
                            "JUMLAH BARANG": "",
                            "SATUAN BARANG": "",
                            "HARGA SATUAN BARANG": "",
                            "MATA UANG": "",
                            "RATE": "",
                            "HARGA TOTAL BARANG": "",
                            "NOMOR BON TERIMA UNIT": "",
                            "TANGGAL BON TERIMA UNIT": "",
                            "USER INPUT": "",
                            "PPN": "",
                            "PPH":""
                        }
                        data.push(_item);
                    }
                    
                    if (dateFrom && dateTo) {
                        response.xls(`Laporan Nota Koreksi -  ${moment(new Date(dateFrom)).format("DD MMM YYYY")} -  ${moment(new Date(dateTo)).format("DD MMM YYYY")}.xlsx`, data, options);
                    } else {
                        response.xls(`Laporan Nota Koreksi -  ${moment(new Date()).format("DD MMM YYYY")}.xlsx`, data, options);
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

