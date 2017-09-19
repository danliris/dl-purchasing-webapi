var Router = require('restify-router').Router;
var db = require("../../../../db");
var resultFormatter = require("../../../../result-formatter");
const apiVersion = '1.0.0';
var PurchaseOrderManager = require("dl-module").managers.purchasing.PurchaseOrderManager;
var passport = require('../../../../passports/jwt-passport');

function getRouter(){
    var router = new Router();
    
    router.get("/", passport, function(request, response, next) {
        db.get().then(db => {
            var manager = new PurchaseOrderManager(db, request.user);
            var sdate = request.params.dateFrom;
            var edate = request.params.dateTo;
            var divisi = request.params.divisi;
            //var divisiId = request.params.divisiId;
            var offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;
            manager.getDataPOStaff(sdate, edate,divisi, offset)
                .then(docs => {
                    if ((request.headers.accept || '').toString().indexOf("application/xls") < 0) {
                        var result = resultFormatter.ok(apiVersion, 200, docs);
                        response.send(200, result);
                    }
                    else {
                         var data = [];
                            var index = 0;
                      
                        }
                })
                .catch(e => {
                    response.send(500, "gagal ambil data");
                });

        }).catch(e => {
            var error = resultFormatter.fail(apiVersion, 400, e);
            response.send(400, error);
        });
    });
    return router;
}

module.exports = getRouter;
