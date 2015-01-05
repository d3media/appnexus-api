'use strict';
var http = require('http'),
    debug = require('debug')('appnexus-api'),
    util = require('util'),
    https = require('https'),
    appnexusUtil = require('./appnexus-util'),
    events = require('events'),
    RateLimiter = require('limiter').RateLimiter,
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
    var limits;
    options = options || {};
    limits = options.limits || {};
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
    if (!limits.writeLimit) {
        limits.writeLimit = 60;
    }
    if (!limits.readLimit) {
        limits.readLimit = 100;
    }
    if (!limits.authLimit) {
        limits.authLimit = 10;
    }
    if (!limits.write_limit_seconds) {
        limits.write_limit_seconds = 60;
    }
    if (!limits.read_limit_seconds) {
        limits.read_limit_seconds = 60;
    }
    if (!limits.auth_limit_seconds) {
        limits.auth_limit_seconds = 5 * 60;
    }
    events.EventEmitter.call(this);
    this.endpoint = endpoint(options.endpoint);
    this.username = options.username;
    this.password = options.password;
    this.writeLimiter = new RateLimiter(limits.writeLimit, limits.write_limit_seconds * 1000);
    this.readLimiter = new RateLimiter(limits.readLimit, limits.read_limit_seconds * 1000);
    this.authLimiter = new RateLimiter(limits.authLimit, limits.auth_limit_seconds * 1000);
}
util.inherits(Appnexus, events.EventEmitter);

function sanitizeQueryOptions(options) {
    options.json = options.json || true;
    if (options.id && ~['string', 'number'].indexOf(typeof options.id)) {
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
        },
        typeOfChange = methodToChangeMap[method];
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
        if (debug.enabled) {
            if (this.body) {
                var buffer = new Buffer(this.body);
                var objectSent = JSON.stringify(JSON.parse(buffer.toString()), null, '\t');
                debug("request %s %s sent: \n %s", this.method, this.href, objectSent);
            }
        } else {
            debug("request %s %s", this.method, this.href);
        }
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

function id2options(id, options) {
    if (!id) {
        return options;
    }
    options = options || {};
    if (~['string', 'number'].indexOf(typeof id)) {
        options.id = id;
        return options;
    }
    return JSON.parse(JSON.stringify(id));
}
Appnexus.prototype.get = function (type, id, callback) {
    var options, self = this;
    if (typeof id === 'function') {
        callback = id;
        id = null;
    }
    this.readLimiter.removeTokens(1, function (err, remainingRequests) {
        if (err) {
            this.emit('error', err);
            return;
        }
        self.query(type, id2options(id), callback);
    });
};
Appnexus.prototype.create = function (type, id, data, callback) {
    var json = {},
        options = {},
        self = this;
    if (!data || typeof data === 'function') {
        callback = data;
        data = id;
        id = null;
    }
    json[type] = data;
    options = id2options(id, {});
    options.json = json;
    options.method = 'POST';
    this.writeLimiter.removeTokens(1, function (err, remainingRequests) {
        if (err) {
            this.emit('error', err);
            return;
        }
        self.query(type, options, callback);
    });
};
Appnexus.prototype.destroy = function (type, id, callback) {
    var options = id2options(id, {
            json: true,
            method: 'DELETE'
        }),
        self = this;
    this.writeLimiter.removeTokens(1, function (err, remainingRequests) {
        if (err) {
            this.emit('error', err);
            return;
        }
        self.query(type, options, callback);
    });
};
Appnexus.prototype.update = function (type, id, data, callback) {
    var json = {},
        options, self = this;
    json[type] = data;
    options = id2options(id, {});
    options.json = json;
    options.method = 'PUT';
    // id can be a string or number, but some operations can require more 
    // than one identifier, like modifying an existing advertiser segment
    // which requires both *code* and *member_id*
    this.writeLimiter.removeTokens(1, function (err, remainingRequests) {
        if (err) {
            this.emit('error', err);
            return;
        }
        self.query(type, options, callback);
    });
};
Appnexus.prototype.authenticate = function (callback) {
    var url = this.endpoint + '/auth',
        payload = {
            auth: {
                username: this.username,
                password: this.password
            }
        },
        that = this;
    this.authLimiter.removeTokens(1, function (err, remainingRequests) {
        if (err) {
            this.emit('error', err);
            return;
        }
        request.post({
            url: url,
            json: payload
        }, function (err, response, body) {
            var token;
            if (err) {
                return callback(err);
            }
            if (appnexusUtil.responseContainsError(response, body)) {
                return appnexusUtil.handleErrorResponse(body, that, callback);
            }
            token = body.response.token;
            if (callback) {
                callback(null, token);
            }
            that.emit('authenticationSucceed', token);
        });
    });
};
Appnexus.prototype.limits = function (callback) {
    this.query('advertiser', 0, function (error, ret) {
        if (error) {
            return callback(error)
        }

        var info = ret.response.dbg_info;

        var limits = {
            read_limit: info.read_limit || 100,
            read_limit_seconds: info.read_limit_seconds || 60,
            write_limit: info.write_limit || 60,
            write_limit_seconds: info.write_limit_seconds || 60,
        };

        return callback(error, limits);
    });
};

function create(options) {
    return new Appnexus(options);
}
exports.create = create;
