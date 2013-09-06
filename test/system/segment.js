var assert = require('assert'),
    uuid = require('node-uuid').v4,
    debug = require('debug')('test:advertiser'),
    client = require('./support/client-instance');
describe('Segment service', function () {
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
    describe('#create("segment", segment [, advertiserID], callback)', function () {
        describe('#createSegment(segment, callback)', function () {
            beforeEach(function (done) {
                var that = this;
                client.once('advertiserCreated', function () {
                    that.advertiserCreatedTriggered = true;
                    done();
                });
                client.create('advertiser', advertiser, function (err, newAdvertiser) {
                    if (err) {
                        console.error(err);
                        console.trace(err.stack);
                        throw err;
                    }
                    that.advertiserCreatedID = newAdvertiser.id;
                });
            });
            afterEach(function (done) {
                var id = this.advertiserCreatedID;
                client.destroy('advertiser', id, function (err) {
                    if (err) {
                        console.error(err);
                        console.trace(err.stack);
                        throw err;
                    }
                    done();
                });
            });
            it('should create a new segment', function (done) {
                var advertiserID = this.advertiserCreatedID;
                client.create('segment', {
                    advertiser_id: advertiserID
                }, function (err, newSegment) {
                    if (err) {
                        throw err;
                    }
                    assert(newSegment);
                    done();
                });
            });
            it('should trigger *segmentCreated*', function (done) {
                var advertiserID = this.advertiserCreatedID;
                client.once('segmentCreated', function () {
                    done();
                });
                client.create('segment', {
                    advertiser_id: advertiserID
                }, function (err, newSegment) {
                    if (err) {
                        throw err;
                    }
                });
            });
        });
    });
});
