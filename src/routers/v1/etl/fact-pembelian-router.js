var Router = require('restify-router').Router;
var router = new Router();
var FactPembelian = require('dl-module').etl.factPembelian;
var db = require('../../../db');
var resultFormatter = require("../../../result-formatter");

const apiVersion = '1.0.0';

function getRouter() {
    router.get('/', (request, response, next) => {

        db.get().then(db => {
            var instance = new FactPembelian(db, {
                username: "unit-test"
            });

            instance.run()

                .then(() => {
                    response.send(200);
                })
        });
    });
    return router;
}

module.exports = getRouter;