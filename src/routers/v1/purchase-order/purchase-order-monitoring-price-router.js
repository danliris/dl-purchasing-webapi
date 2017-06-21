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

            var dateFrom = request.params.dateFrom;
            var dateTo = request.params.dateTo;
            var productName = request.params.productName;

            manager.getPrice(dateFrom, dateTo, productName)
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
                                        "Nama Barang": PO.items.product.name,
                                        "Kode Barang": PO.items.product.code,
                                        "Jumlah Barang": PO.items.dealQuantity ? PO.items.dealQuantity : 0,
                                        "Satuan Barang": PO.items.dealUom.unit ? PO.items.dealUom.unit : "-",
                                        "Harga Barang": PO.purchaseOrderExternal ? (PO.items.pricePerDealUnit * PO.purchaseOrderExternal.currencyRate) : 0,
                                        "Harga Total": PO.purchaseOrderExternal ? (PO.items.pricePerDealUnit * PO.items.dealQuantity * PO.purchaseOrderExternal.currencyRate) : 0,
                                        "Kode Supplier": PO.supplier.code ? PO.supplier.code : "-",
                                        "Nama Supplier": PO.supplier.name ? PO.supplier.name : "-",
                                        "Tanggal Terima PO Eksternal": PO.purchaseOrderExternal.date ? moment(new Date(PO.purchaseOrderExternal.date)).format(dateFormat) : "-",
                                        "No PO Eksternal": PO.purchaseOrderExternal.no ? PO.purchaseOrderExternal.no : "-",
                                        "Tanggal Invoice": fulfillment.invoiceDate ? moment(new Date(fulfillment.invoiceDate)).format(dateFormat) : "-",
                                        "No Invoice": fulfillment.invoiceNo ? fulfillment.invoiceNo : "-",
                                        "Mata Uang": PO.currency.symbol
                                  }
                                    data.push(_item);
                                }
                            }
                            else {
                                index++;
                                var _item = {
                                    "No": index,
                                    "Nama Barang": PO.items.product.name,
                                    "Kode Barang": PO.items.product.code,
                                    "Tanggal Terima PO Eksternal": PO.purchaseOrderExternal.date ? moment(new Date(PO.purchaseOrderExternal.date)).format(dateFormat) : "-",
                                    "No PO Eksternal": PO.purchaseOrderExternal.no,
                                    "Kode Supplier": PO.supplier.code ? PO.supplier.code : "-",
                                    "Nama Supplier": PO.supplier.name ? PO.supplier.name : "-",
                                    "Tanggal Invoice": "-",
                                    "No Invoice": "-",
                                    "Jumlah Barang": PO.items.dealQuantity ? PO.items.dealQuantity : 0,
                                    "Satuan Barang": PO.items.dealUom.unit ? PO.items.dealUom.unit : "-",
                                    "Harga Barang": PO.purchaseOrderExternal.currencyRate ? (PO.items.pricePerDealUnit * PO.purchaseOrderExternal.currencyRate) : 0,
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