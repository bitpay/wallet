var cryptoUtil = require('../../util/crypto');

/**
 * Module to store and retrieve the state from localstorage
 */
module.exports = LocalStorageStateProvider = {};

/**
 * Retrieve an identity's state from localstorage
 *
 * @param {Identity} identity - the identity for which to retrieve state
 * @param {Function} callback - called when finished with (err, identity)
 */
LocalStorageStateProvider.retrieve(identity, callback) {
  identity.setWallets(
    cryptoUtil.decrypt(
      identity.getPassphrase(),
      localStorage.getItem('wallets::' + identity.getEmail())
    )
  );
  callback(null, identity);
};

/**
 * Stores an identity into localstorage
 *
 * @param {Identity} identity - the identity to be stored
 * @param {Function} callback - called when finished with (err, identity)
 */
LocalStorageStateProvider.save(identity, callback) {
  localStorage.setItem('wallets::' + identity.getEmail(),
    cryptoUtil.encrypt(
      identity.getPassphrase(),
      identity.getWallets()
    )
  );
  callback(null, identity);
};

