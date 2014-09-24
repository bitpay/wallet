/**
 * Used to retrieve and set public information regarding a profile.
 */
function PublicRecordInsightStorage(opts) {
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
PublicRecordInsightStorage.prototype.retrieveProfileByXpubkey = function(xpubkey, opts, callback) {
}

/**
 * Publishes information about this profile on a public record in Insight
 *
 * @param {Identity} identity
 * @param {Object} opts
 * @param {ProfileCallback} callback
 */
PublicRecordInsightStorage.prototype.publishProfile = function(identity, opts, callback) {
}

module.exports = PublicRecordInsightStorage;

