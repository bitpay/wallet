'use strict';

var imports = require('soop').imports();
var bitcore = require('bitcore');

/* Encrypted, authenticated messages to be shared between copayers */
var Message = function() {
};

Message.encode = function(topubkey, fromkey, payload) {
  var version = new Buffer([0]);
  var toencrypt = Buffer.concat([version, payload]);
  var encrypted = Message._encrypt(topubkey, toencrypt);
  var sig = Message._sign(fromkey, encrypted);
  var encoded = {
    pubkey: fromkey.public.toString('hex'),
    sig: sig.toString('hex'),
    encrypted: encrypted.toString('hex')
  };
  return encoded;
};

Message.decode = function(key, encoded) {
  try {
    var frompubkey = new Buffer(encoded.pubkey, 'hex');
  } catch (e) {
    throw new Error('Error decoding public key: ' + e);
  }

  try {
    var sig = new Buffer(encoded.sig, 'hex');
    var encrypted = new Buffer(encoded.encrypted, 'hex');
  } catch (e) {
    throw new Error('Error decoding data: ' + e);
  }
  
  try {
    var v = Message._verify(frompubkey, sig, encrypted);
  } catch (e) {
    throw new Error('Error verifying signature: ' + e);
  }

  if (!v)
    throw new Error('Invalid signature');

  try {
    var decrypted = Message._decrypt(key.private, encrypted);
  } catch (e) {
    throw new Error('Cannot decrypt data: ' + e);
  }

  if (decrypted[0] !== 0)
    throw new Error('Invalid version number');

  if (decrypted.length === 0)
    throw new Error('No data present');

  var payload = decrypted.slice(1);
  return payload;
};

Message._encrypt = function(topubkey, payload, r, iv) {
  var encrypted = bitcore.ECIES.encrypt(topubkey, payload, r, iv);
  return encrypted;
};

Message._decrypt = function(privkey, encrypted) {
  var decrypted = bitcore.ECIES.decrypt(privkey, encrypted);
  return decrypted;
};

Message._sign = function(key, payload) {
  var sig = bitcore.Message.sign(payload, key);
  return sig;
};

Message._verify = function(pubkey, signature, payload) {
  var v = bitcore.Message.verifyWithPubKey(pubkey, payload, signature);
  return v;
};

module.exports = require('soop')(Message);
