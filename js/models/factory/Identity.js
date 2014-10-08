var        _ = require('underscore'),
    Identity = require('../Identity');

/**
 * Builds an Identity from an extended private key
 */
function IdentityFactory(opts) {
  opts = opts || {};
  this.stateProvider = opts.stateProvider || require('../../persistence/state/localstorage');
  this.listeners = _.clone(opts.listeners || IdentityFactory.listeners || {});
}

IdentityFactory.prototype.create = function (xprivkey, email, passphrase, callback) {

  var identity = new Identity(xprivkey, email, passphrase);

  // Append all event listeners
  _.each(this.listeners, function(listeners, event) {
    _.each(listeners, function(listener) { identity.on(event, listener, identity); });
  });
  this.stateProvider.retrieve(identity, callback);
};

IdentityFactory.listeners = {};

module.exports = IdentityFactory;
