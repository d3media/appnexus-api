var assert = require('assert'),
    debug = require('debug')('test:member'),
    client = require('./support/client-instance');
describe('Advertiser', function () {
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
    describe('#readMember(callback)', function () {
        // https://wiki.appnexus.com/display/api/Member+Service
        it('should return MY member', function (done) {
            client.readMember(function (err, member) {
                if (err) {
                    throw err;
                }
                assert(member);
                assert(member.id);
                done();
            });
        });
    });
});
