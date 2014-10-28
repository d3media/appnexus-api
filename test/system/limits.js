var assert = require('assert'),
    debug = require('debug')('test:member'),
    client = require('./support/client-instance');
describe('Limits', function () {
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
    describe('#limits(callback)', function () {
        // https://wiki.appnexus.com/display/api/Member+Service
        it('should return MY limits', function (done) {
            client.limits(function (err, limits) {
                if (err) {
                    throw err;
                }
                assert(limits);
                assert(limits.read_limit);
                assert(limits.read_limit_seconds);
                assert(limits.write_limit);
                assert(limits.write_limit_seconds);
                done();
            });
        });
    });
});