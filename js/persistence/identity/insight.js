/**
 * @namespace InsightIdentityStorage
 *
 * Stores an identity into an insight server
 */

module.exports = InsightIdentityStorage = {};

/**
 * Stores an identity safely in an Insight server
 *
 * @param {Identity} identity
 * @param {Object} opts
 * @param {IdentityCallback} callback
 */
InsightIdentityStorage.storeIdentity = function(identity, opts, callback) {
};

/**
 * Restores an identity stored in an Insight server
 *
 * @param {Identity} identity
 * @param {Object} opts
 * @param {string} opts.email
 * @param {string} opts.password
 * @param {IdentityCallback} callback
 */
InsightIdentityStorage.restoreIdentity = function(opts, callback) {
};

/**
 * Watches an identity for changes and triggers a storeIdentity call when the Identity fires a
 * 'update' event.
 *
 * @param {Identity} identity
 * @param {Object} opts
 */
InsightIdentityStorage.watchIdentity = function(identity, opts) {
};

