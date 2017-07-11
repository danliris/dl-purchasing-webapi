var Router = require('restify-router').Router;
var router = new Router();
var db = require("../../../../db");
var resultFormatter = require("../../../../result-formatter");
const apiVersion = '1.0.0';
var PurchaseOrderManager = require("dl-module").managers.purchasing.PurchaseOrderManager;
var passport = require('../../../../passports/jwt-passport');

function getRouter() {
    var router = new Router();
    router.get("/", passport, function (request, response, next) {
        db.get().then(db => {
            var manager = new PurchaseOrderManager(db, request.user);
            var sdate = request.params.dateFrom;
            var edate = request.params.dateTo;
            var divisi = request.params.divisi;
            var unit = request.params.unit;
            var category = request.params.category;
            var currency = request.params.currency;
            var offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;
            manager.getDataPOUnitCategory(sdate, edate, divisi, unit, category, currency, offset)
                .then(docs => {
                    if ((request.headers.accept || '').toString().indexOf("application/xls") < 0) {
                        var result = resultFormatter.ok(apiVersion, 200, docs);
                        response.send(200, result);
                    }
                    else {
                        var dateFormat = "DD MMMM YYYY";
                        var dateFormat2 = "DD-MMMM-YYYY";
                        var locale = 'id-ID';
                        var moment = require('moment');
                        moment.locale(locale);

                        var data = [];
                        var index = 0;
                        var PriceTotals = 0;
                        for (var Po of docs) {
                            PriceTotals += Po.pricetotal;
                        }
                        for (var purchaseOrder of docs) {
                            index++;
                            var x = purchaseOrder.pricetotal.toFixed(2).toString().split('.');
                            var x1 = x[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            var amount = x1 + '.' + x[1];

                            var tx = purchaseOrder.pricePerCurrency.toFixed(2).toString().split('.');
                            var tx1 = tx[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            var amountcurrency = tx1 + '.' + tx[1];

                            var item = {
                                "No": index,
                                "Divisi": purchaseOrder._id.division,
                                "Unit": purchaseOrder._id.unit,
                                "Kategori": purchaseOrder._id.category,
                                "Mata Uang": purchaseOrder._id.currency,
                                "Harga per Mata Uang": amountcurrency,
                                "IDR": amount,
                                "%": ((purchaseOrder.pricetotal / PriceTotals) * 100).toFixed(2)
                            }
                            data.push(item);
                        }
                        var TotalPercentage = 0;
                        for (var purchaseOrder of docs) {
                            TotalPercentage += ((purchaseOrder.pricetotal / PriceTotals) * 100);
                        }
                        var y = PriceTotals.toFixed(2).toString().split('.');
                        var y1 = y[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        var amounts = y1 + '.' + y[1];
                        var totals = {
                            "Harga per Mata Uang": "Total",
                            "IDR": amounts,
                            "%": TotalPercentage
                        };
                        data.push(totals);
                        var options = {
                            "No": "number",
                            "Divisi": "string",
                            "Unit": "string",
                            "Kategori": "string", "Mata Uang": "string",
                            "Harga per Mata Uang": "number",
                            "IDR": "number",
                            "%": "number",
                        };
                        if (sdate != undefined && edate != undefined) {
                            response.xls(`Laporan Total Pembelian Per Unit Per Kategori ${moment(sdate).format(dateFormat)} - ${moment(edate).format(dateFormat)}.xlsx`, data, options);
                        }
                        else if (!sdate && edate) {
                            response.xls(`Laporan Total Pembelian Per Unit Per Kategori sampai tanggal ${moment(edate).format(dateFormat)}.xlsx`, data, options);
                        }
                        else if (sdate && !edate) {
                            response.xls(`Laporan Total Pembelian Per Unit Per Kategori dari tanggal ${moment(sdate).format(dateFormat)}.xlsx`, data, options);
                        }
                        else
                            response.xls(`Laporan Total Pembelian Per Unit Per Kategori.xlsx`, data, options);
                    }
                })
                .catch(e => {
                    var error = resultFormatter.fail(apiVersion, 400, e);
                    response.send(400, error);
                });
        })
            .catch(e => {
                var error = resultFormatter.fail(apiVersion, 400, e);
                response.send(400, error);
            });
    });
    return router;
}

module.exports = getRouter;