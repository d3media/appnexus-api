var assert = require('assert'),
    uuid = require('node-uuid').v4,
    debug = require('debug')('test:advertiser'),
    client = require('./support/client-instance');
describe('Advertiser', function () {
    var advertiser = {
        name: uuid()
    };
    before(function (done) {
        if (client.token) {
            return done();
        }
        debug('authenticating client');
        client.once('authenticationSucceed', function () {
            debug('authenticationSucceed');
            done();
        });
        client.authenticate(function (err, token) {
            if (err) {
                throw err;
            }
            client.token = token;
        });
    });
    beforeEach(function (done) {
        var that = this;
        client.once('advertiserCreated', function (token) {
            that.advertiserCreatedTriggered = true;
            done();
        });
        client.create('advertiser', advertiser, function (err, newAdvertiser) {
            if (err) {
                console.error(err);
                throw err;
            }
            that.advertiserCreatedID = newAdvertiser.id;
        });
    });
    afterEach(function (done) {
        if (this.AdvertiserAlreadyDeleted) {
            return done();
        }
        var id = this.advertiserCreatedID;
        client.destroy('advertiser',id, function (err) {
            if (err) {
                console.error(err);
                console.trace(err.stack);
                throw err;
            }
            done();
        });
    });
    describe('#create("advertiser", advertiser, [callback])', function () {
        it('should create a new advertiser', function () {
            assert(this.advertiserCreatedID);
        });
        it('should trigger *advertiserCreated* on success', function () {
            assert(this.advertiserCreatedTriggered);
        });
    });
    describe('#update("advertiser", id, update, [callback])', function () {
        it('should update an existing advertiser', function (done) {
            var id = this.advertiserCreatedID;
            client.update('advertiser',id, {
                name: 'torcuato'
            }, function (err, updatedId) {
                if (err) {
                    throw err;
                }
                assert(updatedId);
                client.get('advertiser',id, function (err, updatedAdvertiser) {
                    assert.equal(updatedAdvertiser.name, 'torcuato');
                    done();
                });
            });
        });
    });
    describe('#get("advertiser", id, callback)', function () {
        it('should return the advertiser', function (done) {
            client.get('advertiser',this.advertiserCreatedID, function (err, actual) {
                assert.deepEqual(actual.name, advertiser.name);
                done();
            });
        });
    });
    describe('#destroy("advertiser", id, callback)', function () {
        it('should delete the advertiser', function (done) {
            var that = this;
            client.destroy("advertiser", this.advertiserCreatedID, function (err) {
                if (err) {
                    console.error(err);
                    console.trace(err.stack);
                    throw err;
                }
                that.AdvertiserAlreadyDeleted = true;
                done();
            });
        });
    });
});
