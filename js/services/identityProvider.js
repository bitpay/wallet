'use strict';

/**
 * Service that provides a set of methods to retrieve or create the identity of the user
 *
 * @param {Object} opts
 */
var IdentityService = function(opts) {
};

IdentityService.prototype.createIdentity = function(email, password, opts, callback) {
};

IdentityService.prototype.restoreIdentityFromBlob = function(blob, email, password, callback) {
};

IdentityService.prototype.restoreIdentityFromProvider = function(email, password, opts, callback) {
};

angular.module('copayApp.services').service('identityService', IdentityService);
