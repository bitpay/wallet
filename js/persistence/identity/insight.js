var cryptoUtil = require('../../util/crypto'),
   querystring = require('querystring');

/**
 * Insight Identity Provider. Can register an email remotely and store/retrieve a master private
 * key.
 *
 * @param {Object} opts
 * @param {string=} opts.insightUrl - the URL with the insight server to store data
 *                                    if not present, the default is taken from the global config
 * @param {Module=} opts.request - the module used for requesting an HTTP resource
 *                                 if not present, the default is the 'request' npm module
 * @param {IdentityFactory=} opts.identityFactory - the factory for an Identity object
 *                                                  the default is the IdentityFactory located in
 *                                                  'js/models/factory/identity'
 */
function InsightIdentityProvider(opts) {
  this.request = opts.request || require('request');
  if (!opts.insightUrl) {
    var config = require('../../../config');
  }
  this.insightUrl = opts.insightUrl || config.network[config.networkName].url;
  this.identityFactory = opts.identityFactory || require('../../models/factory/identity');
  this.registerUrl = this.insightUrl + '/email/register';
  this.retrieveUrl = this.insightUrl + '/email/retrieve';
}

// Error messages

InsightIdentityProvider.INVALID_CREDENTIALS = 'Invalid credentials. Check your password';
InsightIdentityProvider.INTERNAL_ERROR = 'An internal error occurred when trying to decrypt your credentials';
InsightIdentityProvider.CONNECTION_ERROR = 'Could not connect to Insight server. Please check your connection';
InsightIdentityProvider.UNABLE_TO_REGISTER = 'Could not register account on server. Maybe that email is already taken?';

/**
 * Register an email with an insight server and store the private key.
 *
 * @param {Identity} identity - the identity to be stored
 * @param {Function} callback - the callback to be called. Possible errors for the first argument
 *                              are: InsightIdentityProvider.CONNECTION_ERROR and
 *                              InsightIdentityProvider.UNABLE_TO_REGISTER
 */
InsightIdentityProvider.prototype.register = function(identity, callback) {
  var key = cryptoUtil.kdf(identity.getPassphrase(), identity.getEmail());
  var secret = cryptoUtil.kdf(key, identity.getPassphrase());
  var record = cryptoUtil.encrypt(key, identity.getXprivkey());
  this.request.post({
    url: this.registerUrl,
    body: querystring.encode({
      email: identity.getEmail(),
      secret: secret,
      record: record
    })
  }, function(err, response, body) {
    if (err) {
      return callback(InsightIdentityProvider.CONNECTION_ERROR);
    }
    if (response.statusCode !== 200) {
      return callback(InsightIdentityProvider.UNABLE_TO_REGISTER);
    }
    return callback();
  });
};

/**
 * Retrieve an Identity from the server.
 *
 * @param {string} email - the user's email
 * @param {string} password - the user's password
 * @param {Object} opts
 * @param {string=} opts.secondFactor - NOT IMPLEMENTED
 * @param {Function} callback - to be called with (err, Identity). The possible errors are:
 *                              INVALID_CREDENTIALS, INTERNAL_ERROR, CONNECTION_ERROR
 */
InsightIdentityProvider.prototype.retrieve = function(email, password, opts, callback) {
  var key = cryptoUtil.kdf(password, email);
  var secret = cryptoUtil.kdf(key, password);
  var that = this;
  this.request.get(this.retrieveUrl + '?' + querystring.encode({secret: secret}),
    function(err, response, body) {
      if (err) {
        return callback(InsightIdentityProvider.CONNECTION_ERROR);
      }
      if (response.statusCode !== 200) {
        return callback(InsightIdentityProvider.INVALID_CREDENTIALS);
      }
      var privateKey = cryptoUtil.decrypt(key, body);
      if (!privateKey) {
        return callback(InsightIdentityProvider.INTERNAL_ERROR);
      }
      return that.identityFactory.create(privateKey, email, password, callback);
    }
  );
};

module.exports = InsightIdentityProvider;
