var Router = require('restify-router').Router;
var db = require("../../../db");
var ObjectId = require("mongodb").ObjectId;
var UnitReceiptNoteManager = require("dl-module").managers.purchasing.UnitReceiptNoteManager;
var resultFormatter = require("../../../result-formatter");
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();
    router.get('/', passport, (request, response, next) => {
        db.get().then(db => {
            var manager = new UnitReceiptNoteManager(db, request.user);
            var unitId = request.params.unitId;
            var staffName = request.params.staffName;
            var dateFrom = request.params.dateFrom;
            var dateTo = request.params.dateTo;
            var offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;
            
            manager.getUnitReceiptWithoutSpb(unitId, staffName, dateFrom, dateTo, offset)
                .then(docs => {
                    var dateFormat = "DD/MM/YYYY";
                    var dateFormat2 = "DD MMM YYYY";
                    var locale = 'id-ID';
                    var moment = require('moment');
                    moment.locale(locale);

                    var data = [];
                    var index = 0;

                    for (var unitReceiptNote of docs) {
                        for (var item of unitReceiptNote.items){
                        
                            index++;
                            var _item = {
                                "No": index,
                                "Unit": `${unitReceiptNote.unit.division.name} - ${unitReceiptNote.unit.name}`,
                                "Supplier": unitReceiptNote.supplier.name,
                                "No Surat Jalan": unitReceiptNote.deliveryOrder.no,
                                "Tanggal Surat Jalan": moment(new Date(unitReceiptNote.deliveryOrder.date)).format(dateFormat),
                                "Staff": unitReceiptNote.jeneng._createdBy,
                                "Tempo": item.purchaseOrder.paymentDueDays + " hari",
                                "Tanggal Bon Terima Unit": moment(new Date(unitReceiptNote.date)).format(dateFormat),
                                "No Bon Terima Unit": unitReceiptNote.no,
                                "User": unitReceiptNote._createdBy
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
                            "Unit": "string",
                            "Supplier": "string",
                            "No Surat Jalan": "string",
                            "Tanggal Surat Jalan": "string",
                            "Staff": "string",
                            "Tempo":"string",
                            "Tanggal Bon Terima Unit": "string",
                            "No Bon Terima Unit": "string",
                            "User":"string"
                        };
                        
                            response.xls(`Laporan Bon Unit yang Belum SPB ${moment(dateFrom).format(dateFormat2)} - ${moment(dateTo).format(dateFormat2)}.xlsx`, data, options);
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