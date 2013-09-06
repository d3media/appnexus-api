'use strict';
var http = require('http'),
    util = require('util'),
    https = require('https'),
    appnexusUtil = require('./appnexus-util'),
    events = require('events'),
    request = require('request').defaults({
        json: true
    });

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

function Appnexus(options) {
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
    events.EventEmitter.call(this);
    this.endpoint = endpoint(options.endpoint);
    this.username = options.username;
    this.password = options.password;
}
util.inherits(Appnexus, events.EventEmitter);

function sanitizeQueryOptions(options) {
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
    if (options.code) {
        options.qs = options.qs || {};
        options.qs.code = options.code;
    }
}

function eventForChange(type, method) {
    var methodToChangeMap = {
        'POST': 'Created',
        'PUT': 'Updated',
        'DELETE': 'Deleted'
    }, typeOfChange = methodToChangeMap[method];
    if (typeOfChange) {
        return type + typeOfChange;
    }
    return false;
}
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
    sanitizeQueryOptions(options);
    request(options, function (err, response, body) {
        var ret;
        if (err) {
            return callback(err);
        }
        if (appnexusUtil.responseContainsError(response, body)) {
            return appnexusUtil.handleErrorResponse(body, client, callback);
        }
        ret = body;
        ret = body.response && body.response.id || ret;
        ret = body.response && body.response[type] || ret;
        callback(null, ret);
        if (eventForChange(type, options.method)) {
            client.emit(eventForChange(type, options.method), ret);
        }
    });
};
/** 
 * HTTP VERBS
 */
Appnexus.prototype.get = function (type, id, callback) {
    var options;
    if (typeof id === 'function') {
        callback = id;
        id = null;
    }
    options = {
        id: id
    };
    this.query(type, options, callback);
};
Appnexus.prototype.create = function (type, data, callback) {
    var json = {};
    json[type] = data;
    this.query(type, {
        json: json,
        method: 'POST'
    }, callback);
};
Appnexus.prototype.destroy = function (type, id, callback) {
    this.query(type, {
        id: id,
        json: true,
        method: 'DELETE'
    }, callback);
};
Appnexus.prototype.update = function (type, id, data, callback) {
    var json = {}, options;
    json[type] = data;
    options = {
        json: json,
        method: 'PUT'
    };
    // id can be a string or number, but some operations can require more 
    // than one identifier, like modifying an existing advertiser segment
    // which requires both *code* and *member_id*
    if (['string', 'number'].indexOf(typeof id)) {
        options.id = id;
        return this.query(type, options, callback);
    } else {
        Object.keys(id).forEach(function (key) {
            options[key] = id[key];
        });
        return this.query(type, options, callback);
    }
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
        if (appnexusUtil.responseContainsError(response, body)) {
            return appnexusUtil.handleErrorResponse(body, callback);
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
