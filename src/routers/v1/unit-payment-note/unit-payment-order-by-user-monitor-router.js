var Router = require('restify-router').Router;
var db = require("../../../db");
var resultFormatter = require("../../../result-formatter");
const apiVersion = '1.0.0';
var PurchaseOrderManager = require("dl-module").managers.purchasing.UnitPaymentOrderManager;
var passport = require('../../../passports/jwt-passport');

function getRouter(){
    var router = new Router();
    router.get("/", passport, function(request, response, next) {
        db.get().then(db => {
            var manager = new PurchaseOrderManager(db, request.user);
            var unitId = request.params.unitId;
            var PRNo = request.params.PRNo;
            var supplierId = request.params.supplierId;
            var dateFrom = request.params.dateFrom;
            var dateTo = request.params.dateTo;
            var staffName = request.params.staffName;
            var noSpb = request.params.noSpb;
            var dateFormat = "DD/MM/YYYY";
                    var dateFormat2 = "DD MMM YYYY";
                    var locale = 'id-ID';
                    var moment = require('moment');
                    moment.locale(locale);
    
            var offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;

 
                   
            manager.getDataMonitorSpb(unitId,PRNo,noSpb,supplierId,dateFrom,dateTo,staffName , offset)
                .then(docs => {

                    
                    if ((request.headers.accept || '').toString().indexOf("application/xls") < 0) {
                        var result = resultFormatter.ok(apiVersion, 200, docs);
                        response.send(200, result);
    
                }
                    else {

                             var data = [];
                             var jeneng = "";
                             var hasil =0;
                             var hasil2 =0;
                            var index = 0;
                                for (var PO of docs) {
                                index++;
                                if(PO.useIncomeTax==true){
                                    hasil=(PO.items.unitReceiptNote.items.deliveredQuantity*PO.items.unitReceiptNote.items.pricePerDealUnit)/10; 
                                    }else{
                                        hasil=0;
                                         }

                                     if(PO.useVat==true){
                                         hasil2=((PO.items.unitReceiptNote.items.deliveredQuantity*PO.items.unitReceiptNote.items.pricePerDealUnit)*PO.vat.rate)/100; 
                                      }else{
                                         hasil2=0;
                                            }
     


                                    

                                var item = {
                                        "No": index,
                                        "Tgl SPB": moment(new Date(PO.date)).add(offset, 'h').format(dateFormat),
                                        "No SPB": PO.no,
                                        "Nama Barang": PO.items.unitReceiptNote.items.product.name,
                                        "Jumlah": PO.items.unitReceiptNote.items.deliveredQuantity,
                                        "Harga Satuan": PO.items.unitReceiptNote.items.pricePerDealUnit,
                                        "Jumlah Harga": PO.items.unitReceiptNote.items.deliveredQuantity*PO.items.unitReceiptNote.items.pricePerDealUnit,
                                        "Ppn": hasil,
                                        "Total": (PO.items.unitReceiptNote.items.deliveredQuantity*PO.items.unitReceiptNote.items.pricePerDealUnit)+hasil,
                                        "Pph": hasil2,
                                        "Tgl PR": moment(new Date(PO.items.unitReceiptNote.items.purchaseOrder.purchaseRequest.date)).format(dateFormat) ,
                                        "No PR": PO.items.unitReceiptNote.items.purchaseOrder.purchaseRequest.no,
                                        "Tgl Bon":moment(new Date(PO.items.unitReceiptNote.date)).add(offset, 'h').format(dateFormat),
                                        "No Bon": PO.items.unitReceiptNote.no,
                                        "Tgl Invoice": moment(new Date(PO.invoceDate)).add(offset, 'h').format(dateFormat),
                                        "No Invoice": PO.invoceNo,
                                        "Jatuh Tempo": moment(new Date(PO.dueDate)).add(offset, 'h').format(dateFormat),
                                        "Supplier": PO.supplier.name,
                                        "Unit": PO.namaUnit,
                                        "Divisi": PO.division.name,
                                        "ADM": PO._createdBy,
                                        "Staff": PO.staff,
                                                                            
                                    }
                                data.push(item);
                            }
                                var options = {
                            "No": "number",
                            "Tgl SPB": "String",
                            "No SPB": "String",
                            "Nama Barang": "String",
                            "Jumlah": "String",
                            "Harga Satuan": "String",
                            "Jumlah Harga": "String",
                            "Ppn": "String",
                            "Total": "String",
                            "Pph": "String",
                            "Tgl Invoice": "String",
                            "No Invoice": "String",
                            "Jatuh Tempo": "String",
                            "Supplier": "String",
                            "Unit": "String",
                            "Divisi": "String",
                            "No PR": "String",
                            "Tgl PR": "String",
                            "No Bon": "String",
                            "Tgl Bon": "String",
                            "ADM": "String",
                            "Staff": "String",
                        };


                        
                        
                        response.xls(`Laporan Monitoring Surat Perintah Bayar - ${moment(new Date()).add(offset, 'h').format(dateFormat2)}.xlsx`, data, options);
                          

                               
                    }
                }).catch(e => {
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
