var    cryptoUtil = require('../../util/crypto'),
                _ = require('underscore'),
          request = require('request'),
          bitauth = require('bitauth'),
          bitcore = require('bitcore'),
              Key = bitcore.Key,
          Profile = require('../../models/Profile'),
  HierarchicalKey = bitcore.HierarchicalKey,
           config = require('../../../config'),
   profileFactory = require('../../models/factory/Profile');

var bufferToArray = function(buffer) {
  var retValue = [];
  _.each(buffer, function(element) { retValue.push(element); });
  return retValue;
};

/**
 * Insight Identity Provider. Can register an email remotely and store/retrieve a master private
 * key.
 *
 * @param {Object} opts
 * @param {string=} opts.insightUrl - the URL with the insight server to store data
 *                                    if not present, the default is taken from the global config
 * @param {Module=} opts.request - the module used for requesting an HTTP resource
 *                                 if not present, the default is the 'request' npm module
 * @param {IdentityFactory=} opts.profileFactory - the factory for a Profile object
 *                                                  the default is the Profile located in
 *                                                  'js/models/factory/profile'
 */
function InsightProfileProvider(opts) {
  this.request = opts.request || request;
  this.insightUrl = opts.insightUrl || config.network[config.networkName].url;
  this.profileFactory = opts.profileFactory || profileFactory;
  this.saveUrl = this.insightUrl + '/public';
  this.retrieveUrl = this.insightUrl + '/public/';
}

// Error messages

InsightProfileProvider.INTERNAL_ERROR = 'An internal error occurred when trying to fetch the profile';
InsightProfileProvider.CONNECTION_ERROR = 'Could not connect to Insight server. Please check your connection';
InsightProfileProvider.COULDNT_SAVE = 'Could not save public info on Insight Server';
InsightProfileProvider.NOT_FOUND = 'Profile for that public key was not found';
InsightProfileProvider.INVALID_PRIVKEY = 'Invalid private key provided';

/**
 * Store public information about a profile in the insight server
 *
 * @param {Profile} profile - the profile to be stored
 * @param {string|HierarchicalKey} xprivkey - the private key for the profile
 * @param {Object} opts
 * @param {Function} callback - the callback to be called with (error, Profile). Possible errors
 *                              for the first argument are:
 *                              InsightProfileProvider.CONNECTION_ERROR and
 *                              InsightProfileProvider.COULDNT_SAVE
 */
InsightProfileProvider.prototype.register = function(profile, xprivkey, opts, callback) {
  var jsonProfile = profile.getAsJsonString();
  this._store(jsonProfile, xprivkey, opts, callback);
};

/**
 * Redirect a public key to another profile (used for multiple master keys that are shared)
 *
 * @param {Profile|HierarchicalKey|string} parentPublicKey - the profile, where to redirect
 * @param {string|HierarchicalKey} xprivkey - the private key for the profile to be redirected
 * @param {Object} opts
 * @param {Function} callback
 */
InsightProfileProvider.prototype.redirect = function(parentPublicKey, xprivkey, opts, callback) {
  // Using duck-typing instead of instanceof
  if (parentPublicKey.getXpubkey) {
    parentPublicKey = bufferToArray(parentPublicKey.getXpubkey().eckey.public);
  }
  if (parentPublicKey instanceof HierarchicalKey) {
    parentPublicKey = bufferToArray(parentPublicKey.public);
  }
  var redirectSin;
  try {
    redirectSin = bitauth.getSinFromPublicKey(parentPublicKey);
  } catch (e) {
    return callback(InsightProfileProvider.INTERNAL_ERROR);
  }
  var body = JSON.stringify({redirect: redirectSin});
  this._store(body, xprivkey, opts, callback);
};

/**
 * @param {string} body
 * @param {string|HierarchicalKey} xprivkey
 * @param {Object} opts
 * @param {Function} callback
 */
InsightProfileProvider.prototype._store = function(body, xprivkey, opts, callback) {
  var dataToSign = this.saveUrl + body;
  var privateKey = null;
  try {
    if (_.isString(xprivkey)) {
      privateKey = bitcore.HierarchicalKey(xprivkey).eckey;
    } else {
      if (!xprivkey.eckey) {
        return callback(InsightProfileProvider.INVALID_PRIVKEY);
      }
      privateKey = xprivkey.eckey;
    }
    privateKey = new bitcore.SIN(bufferToArray(privateKey.private));
  } catch (e) {
    return callback(InsightProfileProvider.INTERNAL_ERROR);
  }
  this.request.post({
    url: this.saveUrl,
    headers: {
      'x-identity': privateKey.pub,
      'x-signature': bitauth.sign(dataToSign, bufferToArray(privateKey.priv))
    },
    body: body
  }, function(err, response, body) {
    if (err) {
      return callback(InsightProfileProvider.CONNECTION_ERROR);
    }
    if (response.statusCode !== 200) {
      return callback(InsightProfileProvider.COULDNT_SAVE);
    }
    return callback(null);
  });
};

/**
 * Retrieve a profile from the server.
 *
 * @param {string|HierarchicalKey} xpubkey - the user's extended master public key
 * @param {Object} opts
 * @param {Function} callback - to be called with (err, Profile). The possible errors are:
 *                              NOT_FOUND, INTERNAL_ERROR, CONNECTION_ERROR
 */
InsightProfileProvider.prototype.retrieve = function(xpubkey, opts, callback) {
  try {
    if (_.isString(xpubkey)) {
      xpubkey = bitcore.HierarchicalKey(xpubkey);
    }
  } catch (e) {
    return callback(InsightProfileProvider.INTERNAL_ERROR);
  }
  if (!xpubkey.eckey) {
    return callback(InsightProfileProvider.INTERNAL_ERROR);
  }
  var sin = bitauth.getSinFromPublicKey(xpubkey.eckey.public);
  this._retrieveBySin(sin, opts, callback);
};

/**
 * @param {string} sin
 * @param {Object} opts
 * @param {Function} callback
 */
InsightProfileProvider.prototype._retrieveBySin = function(sin, opts, callback) {
  var that = this;
  this.request.get(this.retrieveUrl + sin, function(err, response, body) {
    if (err) {
      return callback(InsightProfileProvider.CONNECTION_ERROR);
    }
    if (response.statusCode !== 200) {
      return callback(InsightProfileProvider.NOT_FOUND);
    }
    try {
      var profileRaw = JSON.parse(body);
    } catch(e) {
      return callback(InsightProfileProvider.INTERNAL_ERROR);
    }
    if (profileRaw.redirect) {
      return that._retrieveBySin(profileRaw.redirect, opts, callback);
    } else {
      return that.profileFactory.create(profileRaw, callback);
    }
  });
};

module.exports = InsightProfileProvider;
