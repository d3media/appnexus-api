var assert = require('assert'),
    appnexus = require('../..');
describe('Authentication', function () {
    describe('#authenticate()', function () {
        var client, authToken, authenticationSucceedTriggered;
        before(function (done) {
            client = appnexus.create({
                username: process.env.APPNEXUS_USERNAME,
                password: process.env.APPNEXUS_PASSWORD,
                endpoint: process.env.APPNEXUS_ENDPOINT
            });
            client.on('authenticationSucceed', function (token) {
                authenticationSucceedTriggered = true;
                done();
            });
            client.authenticate(function (err, token) {
                if (err) {
                    console.error(err);
                    throw err;
                }
                authToken = token;
            });
        });
        it('should return an authentication token', function () {
            assert(authToken);
        });
        it('should trigger *authenticationSucceed* on success', function () {
            assert(authenticationSucceedTriggered);
        });
    });
    describe('Appnexus on NOAUTH', function () {
        describe('If appnexus does not accept our token', function () {
            it('should trigger the *NOAUTH* event', function (done) {
                var client = appnexus.create({
                    username: 'p.revington',
                    password: 'novalidpassword',
                    endpoint: process.env.APPNEXUS_ENDPOINT
                }),
                    noop = function () {};
                client.on('NOAUTH', function (token) {
                    done();
                });
                client.readMember(noop);
            });
        });
    });
});
