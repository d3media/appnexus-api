var assert = require('assert'),
    uuid = require('node-uuid').v4,
    client = require('./support/client-instance');
describe('Advertiser', function () {
    var advertiser = {
        name: uuid()
    };
    before(function (done) {
        if (client.token) {
            return done();
        }
        console.error('client was not authenticated... authenticating');
        client.authenticate(function (err, token) {
            if (err) {
                throw err;
            }
            client.token = token;
            done();
        });
    });
    beforeEach(function (done) {
        var that = this;
        client.once('advertiserCreated', function (token) {
            that.advertiserCreatedTriggered = true;
            done();
        });
        client.createAdvertiser(advertiser, function (err, id) {
            if (err) {
                console.error(err);
                throw err;
            }
            that.advertiserCreatedID = id;
        });
    });
    afterEach(function (done) {
        if (this.AdvertiserAlreadyDeleted) {
            return done();
        }
        var id = this.advertiserCreatedID;
        client.deleteAdvertiser(id, function (err) {
            if (err) {
                console.error(err);
                console.trace(err.stack);
                throw err;
            }
            done();
        });
    });
    describe('#createAdvertiser(advertiser, [callback])', function () {
        it('should create a new advertiser', function () {
            assert(this.advertiserCreatedID);
        });
        it('should trigger *advertiserCreated* on success', function () {
            assert(this.advertiserCreatedTriggered);
        });
    });
    describe('#updateAdvertiser(id, update, [callback])', function () {
        it('should update an existing advertiser', function (done) {
            var id = this.advertiserCreatedID;
            client.updateAdvertiser(id, {
                name: 'torcuato'
            }, function (err, updatedId) {
                if (err) {
                    throw err;
                }
                assert(updatedId);
                client.readAdvertiser(id, function (err, updatedAdvertiser) {
                    assert.equal(updatedAdvertiser.name, 'torcuato');
                    done();
                });
            });
        });
    });
    describe('#readAdvertiser([id, callback])', function () {
        it('should return the advertiser', function (done) {
            client.readAdvertiser(this.advertiserCreatedID, function (err, actual) {
                assert.deepEqual(actual.name, advertiser.name);
                done();
            });
        });
    });
    describe('#deleteAdvertiser(id, [callback])', function () {
        it('should delete the advertiser', function (done) {
            var that = this;
            client.deleteAdvertiser(this.advertiserCreatedID, function (err) {
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
