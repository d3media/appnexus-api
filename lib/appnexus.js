'use strict';
var http = require('http'),
    util = require('util'),
    https = require('https'),
    events = require('events'),
    request = require('request');
var defaults = {
    service: 'http://sand.api.appnexus.com'
};

function buildHTTPServer(listener) {
    var app = http.createServer(listener),
        addr = app.address(),
        port, protocol;
    if (!addr) {
        app.listen(0);
    }
    port = app.address().port;
    protocol = app instanceof https.Server ? 'https' : 'http';
    return protocol + '://127.0.0.1:' + port;
}

function endpoint(resource) {
    return ('function' === typeof resource) ? buildHTTPServer(resource) : resource;
}

function setOptions(options) {
    options = options || {};
    if (!options.endpoint) {
        throw new Error('"endpoint" can not be empty or null');
    }
    options.endpoint = endpoint(options.endpoint);
    if (!options.username) {
        throw new Error('"user" can not be empty or null');
    }
    if (!options.password) {
        throw new Error('"password" can not be empty or null');
    }
}

function requestFailed(response, body) {
    if (body.response && body.response.status && body.response.status === 'OK') {
        return false;
    }
    return true;
}

function Appnexus(options) {
    setOptions(options);
    events.EventEmitter.call(this);
    this.endpoint = endpoint(options.endpoint);
    this.username = options.username;
    this.password = options.password;
}
util.inherits(Appnexus, events.EventEmitter);
Appnexus.prototype.authenticate = function (callback) {
    var url = this.endpoint + '/auth',
        payload = {
            auth: {
                username: this.username,
                password: this.password
            }
        }, that = this;
    request.post({
        url: url,
        json: payload
    }, function (err, response, body) {
        var token;
        if (err) {
            return callback(err);
        }
        if (requestFailed(response, body)) {
            var error = new Error(body && body.response && body.response.error || err);
            return callback(error);
        }
        token = body.response.token;
        if (callback) {
            callback(null, token);
        }
        that.emit('authenticationSucceed', token);
    });
};

function create(options) {
    return new Appnexus(options);
}
exports.create = create;
