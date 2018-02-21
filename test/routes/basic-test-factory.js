require("should");
const host = `${process.env.IP}:${process.env.PORT}`;
var Request = require("supertest");
var ObjectId = require("mongodb").ObjectId;

function getBasicTest(opt) {


    var options = opt || {};
    var validate = options.validate;
    var Model = options.model;
    var util = options.util;
    var uri = options.uri;
    var keyword = options.keyword;

    var request = Request(host);
    var jwt;

    before("#00. get security token", function(done) {
        var getToken = require("../token");
        getToken()
            .then((token) => {
                jwt = token;
                done();
            })
            .catch((e) => {
                done(e);
            });
    });

    it(`#01. get list of accounts - [GET]${uri}`, function(done) {
        request
            .get(uri)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(200)
            .expect("Content-Type", "application/json")
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    var result = response.body;
                    result.should.have.property("apiVersion");
                    result.should.have.property("data");
                    result.data.should.instanceOf(Array);
                    done();
                }
            });
    });

    it(`#02. get data by unknown id - [GET]${uri}/:id`, function(done) {
        request
            .get(`${uri}/${new ObjectId()}`)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(404)
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    done();
                }
            });
    });

    it(`#03. create data by empty object - [POST]${uri}`, function(done) {
        request
            .post(uri)
            .send({})
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(400)
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    var result = response.body;
                    result.should.have.property("apiVersion");
                    result.should.have.property("message");
                    result.should.have.property("error");
                    var error = result.error;
                    // error.should.have.property("code");
                    // error.should.have.property("name");
                    done();
                }
            });
    });

    var createdDataLocation;
    it(`#04. create new data and set header.location- [POST]${uri}`, function(done) {
        util.getNewData()
            .then((data) => {
                request
                    .post(uri)
                    .send(data)
                    .set("authorization", `Bearer ${jwt}`)
                    .set("Accept", "application/json")
                    .expect(201)
                    .expect("Content-Type", "application/json")
                    .end(function(err, response) {
                        if (err)
                            done(err);
                        else {
                            var result = response.body;
                            result.should.have.property("apiVersion");
                            result.should.have.property("message");

                            var header = response.header;
                            header.should.have.property("location");
                            createdDataLocation = header.location;

                            done();
                        }
                    });
            })
            .catch((e) => {
                done(e);
            });
    });

    var createdData;
    it(`#05. get created data from header.location [GET]${uri}/:id`, function(done) {
        request
            .get(createdDataLocation)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(200)
            .expect("Content-Type", "application/json")
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    var result = response.body;
                    result.should.have.property("apiVersion");
                    result.should.have.property("data");
                    result.data.should.instanceOf(Object);

                    var data = new Model(result.data);
                    validate(data);

                    createdData = data;
                    done();
                }
            });
    });

    it(`#06. update created data with unknown id - [PUT]${uri}/:id`, function(done) {
        request
            .put(`${uri}/${new ObjectId()}`)
            .send(createdData)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(404)
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    done();
                }
            });
    });

    it(`#07. update created data - [PUT]${uri}/:id`, function(done) {
        request
            .put(`${uri}/${createdData._id}`)
            .send(createdData)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(204)
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    done();
                }
            });
    });

    it(`#08. get updated data - [GET]/${uri}/:id`, function(done) {
        request
            .get(`${uri}/${createdData._id}`)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(200)
            .expect("Content-Type", "application/json")
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    var result = response.body;
                    result.should.have.property("apiVersion");
                    result.should.have.property("data");
                    result.data.should.instanceOf(Object);

                    var updatedData = new Model(result.data);
                    updatedData._createdBy.should.equal(createdData._createdBy);
                    updatedData._createAgent.should.equal(createdData._createAgent);
                    // updatedData._createdDate.getTime().should.equal(createdData._createdDate.getTime());

                    // updatedData._updatedDate.getTime().should.equal(createdData._updatedDate.getTime());
                    updatedData._stamp.should.not.equal(createdData._stamp);

                    validate(updatedData);
                    createdData = updatedData;
                    done();
                }
            });
    });

    it(`#09. get list of data with keyword - [GET]${uri}?keyword`, function(done) {
        request
            .get(`${uri}?keyword=${createdData[keyword]}`)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(200)
            .expect("Content-Type", "application/json")
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    var result = response.body;
                    result.should.have.property("apiVersion");
                    result.should.have.property("data");
                    result.data.should.instanceOf(Array);

                    result.should.have.property("info");
                    result.info.should.instanceOf(Object);
 
                    if (keyword) {
                        var data = result.data;
                        // data.length.should.equal(1);

                        var info = result.info;
                        info.should.have.property("count");
                        // info.count.should.equal(1);
                    }
                    done();
                }
            });
    });

    it(`#10. delete created data with unknown id - [DELETE]/${uri}/:id`, function(done) {
        request
            .delete(`${uri}/${new ObjectId()}`)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(404)
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    done();
                }
            });
    });

    it(`#11. delete created data - [DELETE]${uri}/:id`, function(done) {
        request
            .delete(`${uri}/${createdData._id}`)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(204)
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    done();
                }
            });
    });

    it(`#12. get deleted data - [GET]${uri}/:id`, function(done) {
        request
            .get(createdDataLocation)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(404)
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    done();
                }
            });
    });

    it(`#14. get list of accounts with keyword - [GET] ${uri}?keyword`, function(done) {
        request
            .get(`${uri}?keyword=${createdData[keyword]}`)
            .set("authorization", `Bearer ${jwt}`)
            .set("Accept", "application/json")
            .expect(200)
            .expect("Content-Type", "application/json")
            .end(function(err, response) {
                if (err)
                    done(err);
                else {
                    var result = response.body;
                    result.should.have.property("apiVersion");
                    result.should.have.property("data");
                    result.data.should.instanceOf(Array);

                    result.should.have.property("info");
                    result.info.should.instanceOf(Object);

                    if (keyword) {
                        var data = result.data;
                        data.length.should.equal(0);

                        var info = result.info;
                        info.should.have.property("count");
                        info.count.should.equal(0);
                    }
                    done();
                }
            });
    });
}


module.exports = getBasicTest;