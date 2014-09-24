/**
 * @callback IdentityCallback
 *
 * @param {Error=} err
 * @param {Identity=} identity
 */

/**
 * Retrieves an Identity from localstorage
 *
 * @param {Object} opts
 * @param {Object} opts.email
 * @param {Object} opts.password
 * @param {IdentityCallback} callback
 */
function retrieveIdentity(opts, callback) {
}

/**
 * Stores an Identity into localstorage
 *
 * @param {Identity} identity
 * @param {Object} opts
 * @param {IdentityCallback} callback
 */
function storeIdentity(identity, opts, callback) {
}

module.exports = {
  retrieveIdentity: retrieveIdentity,
  storeIdentity: storeIdentity
}

