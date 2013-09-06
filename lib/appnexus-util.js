'use strict';
function responseContainsError(response, body) {
    if (body && body.response && body.response.error_id) {
        return true;
    }
    if (body && body.response && body.response.status && body.response.status === 'OK') {
        return false;
    }
    return true;
}
exports.responseContainsError = responseContainsError;

function wrapAppnexusError(body) {
    var error = new Error(body && body.response && body.response.error || err);
    error.error_id = body && body.response && body.response.error_id;
    return error;
}
exports.wrapAppnexusError = wrapAppnexusError;

function handleErrorResponse(body, eventEmitter, callback) {
    var error = wrapAppnexusError(body);
    if (error.error_id) {
        eventEmitter.emit(error.error_id, body.response);
    }
    return callback(error);
}
exports.handleErrorResponse = handleErrorResponse;
