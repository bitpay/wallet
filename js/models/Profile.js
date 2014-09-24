var inherits = require('inherits'),
      events = require('events'),
           _ = require('underscore');
/**
 * A profile stores the selected name, picture, email and extended public key for an user.
 *
 * @extends {events.EventEmitter}
 * @param {Object} opts
 * @param {string} opts.xpubkey
 * @param {string} opts.fullname
 * @param {string} opts.email
 * @param {string} opts.picture
 */
function Profile(opts) {
  _.extend(this, opts);
  events.EventEmitter.call(this);
}
inherits(Profile, events.EventEmitter);

