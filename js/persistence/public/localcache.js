/**
 * Wraps another PublicStorage provider to retrieve and set public information regarding a profile,
 * storing a cached copy on localstorage.
 */
function LocalCachePublicStorage(opts) {
}

/**
 * @callback ProfileCallback
 * @param {Error=} err
 * @param {Profile=} profile
 */

/**
 * Retrieve an Identity's public profile
 *
 * @param {string} xpubkey
 * @param {Object} opts
 * @param {ProfileCallback} callback
 */
LocalCachePublicStorage.prototype.retrieveProfileByXpubkey = function(xpubkey, opts, callback) {
};

/**
 * Publishes information about this profile on a public record. Falls through to the wrapped
 * class.
 *
 * @param {Identity} identity
 * @param {Object} opts
 * @param {ProfileCallback} callback
 */
LocalCachePublicStorage.prototype.publishProfile = function(identity, opts, callback) {
};

module.exports = LocalCachePublicStorage;

