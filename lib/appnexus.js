'use strict';
var http = require('http'),
    util = require('util'),
    https = require('https'),
    events = require('events'),
    request = require('request').defaults({
        json: true
    });
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
    if (body && body.response && body.response.error_id && body.response.error_id === 'NOAUTH') {
        this.emit('NOAUTH');
        return false;
    }
    if (body && body.response && body.response.status && body.response.status === 'OK') {
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
Appnexus.prototype.query = function (type, options, callback) {
    var client = this;
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};
    options.headers = {
        'Authorization': client.token
    };
    options.url = options.url || client.endpoint + '/' + type;
    options.json = options.json || true;
    options.method = options.method || 'GET';
    if (options.id) {
        options.qs = options.qs || {};
        options.qs.id = options.id;
    }
    if (options.advertiser_id) {
        options.qs = options.qs || {};
        options.qs.advertiser_id = options.advertiser_id;
    }
    if (options.advertiser_code) {
        options.qs = options.qs || {};
        options.qs.advertiser_code = options.advertiser_code;
    }
    request(options, function (err, response, body) {
        var ret;
        if (err) {
            return callback(err);
        }
        if (requestFailed.call(client, response, body)) {
            var error = new Error(body && body.response && body.response.error || err);
            return callback(error);
        }
        ret = body;
        ret = body.response && body.response.id || ret;
        ret = body.response && body.response[type] || ret;
        callback(null, ret);
        if (options.method === 'POST') {
            client.emit(type + 'Created');
        }
    });
};
Appnexus.prototype.GET = function (type, id, callback) {
    if (typeof id === 'function') {
        callback = id;
        id = null;
    }
    var options = {
        id: id
    };
    this.query(type, options, callback);
};
Appnexus.prototype.POST = function (type, data, callback) {
    var json = {};
    json[type] = data;
    this.query(type, {
        json: json,
        method: 'POST'
    }, callback);
};
Appnexus.prototype.DELETE = function (type, id, callback) {
    this.query(type, {
        id: id,
        json: true,
        method: 'DELETE'
    }, callback);
};
Appnexus.prototype.PUT = function (type, id, data, callback) {
    var json = {}, i;
    json[type] = data;
    var options = {
        json: json,
        method: 'PUT'
    };
    if (['string', 'number'].indexOf(typeof id)) {
        options.id = id;
        return this.query(type, options, callback);
    }
    Object.keys(id).forEach(function (key) {
        options[key] = id[key];
    });
    return this.query(type, options, callback);
};
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
        if (requestFailed.call(that, response, body)) {
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
Appnexus.prototype.createAdvertiser = function (advertiser, callback) {
    var type = 'advertiser';
    this.POST(type, advertiser, callback);
};
Appnexus.prototype.updateAdvertiser = function (id, update, callback) {
    var type = 'advertiser';
    this.PUT(type, id, update, callback);
};
Appnexus.prototype.readAdvertiser = function (id, callback) {
    var type = 'advertiser';
    this.GET(type, id, callback);
};
Appnexus.prototype.deleteAdvertiser = function (id, callback) {
    var type = 'advertiser';
    this.DELETE(type, id, callback);
};
// Member
// https://wiki.appnexus.com/display/api/Member+Service
Appnexus.prototype.readMember = function (callback) {
    var type = 'member';
    this.GET(type, callback);
};

function create(options) {
    return new Appnexus(options);
}
exports.create = create;
