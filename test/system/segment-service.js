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
    describe('#createSegment(segment [, advertiserID], callback)', function () {
        describe('#createSegment(segment, callback)', function () {
            it('should create a new segment');
            it('should trigger *segmentCreated*');
        });
        describe('#createSegment(segment, advertiserID, callback)', function () {
            it('should create a new segment for a given advertiser');
            it('should trigger *segmentCreated*');
        });
    });
    describe('#updateSegment(segmentID, update, callback)', function () {
        describe('#updateSegment(segment, callback)', function () {
            it('should update that segment');
            it('should trigger *segmentUpdated*');
        });
    });
    describe('#readSegment(segmentID, callback)', function () {
        it('should read that segment');
        it('should fail if the segment does not exist');
    });
});
