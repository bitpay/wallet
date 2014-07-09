'use strict';

var imports = require('soop').imports();
var bitcore = require('bitcore');

/* Encrypted, authenticated messages to be shared between copayers */
var Message = function() {
};

Message.encode = function(topubkey, fromkey, payload, opts) {
  var version1 = new Buffer([1]); //peers will reject messges containing not-understood version1
                                  //i.e., increment version1 to prevent communications with old clients
  var version2 = new Buffer([0]); //peers will not reject messages containing not-understood version2
                                  //i.e., increment version2 to allow communication with old clients, but signal new clients

  if (opts && opts.nonce && Buffer.isBuffer(opts.nonce) && opts.nonce.length == 8) {
    var nonce = opts.nonce;
  } else {
    var nonce = new Buffer(8);
    nonce.fill(0); //nonce is a big endian 8 byte number
  }

  var toencrypt = Buffer.concat([version1, version2, nonce, payload]);
  var toencrypthexbuf = new Buffer(toencrypt.toString('hex')); //due to bug in sjcl/bitcore, must use hex string
  var encrypted = Message._encrypt(topubkey, toencrypthexbuf);
  var sig = Message._sign(fromkey, encrypted);
  var encoded = {
    pubkey: fromkey.public.toString('hex'),
    sig: sig.toString('hex'),
    encrypted: encrypted.toString('hex')
  };
  return encoded;
};

Message.decode = function(key, encoded, opts) {
  if (opts && opts.prevnonce && Buffer.isBuffer(opts.prevnonce) && opts.prevnonce.length == 8) {
    var prevnonce = opts.prevnonce;
  } else {
    var prevnonce = new Buffer(8);
    prevnonce.fill(0); //nonce is a big endian 8 byte number
  }

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

  if (!v) {
    throw new Error('Invalid signature');
  }

  try {
    var decryptedhexbuf = Message._decrypt(key.private, encrypted);
    var decrypted = new Buffer(decryptedhexbuf.toString(), 'hex'); //workaround for bug in bitcore/sjcl
  } catch (e) {
    throw new Error('Cannot decrypt data: ' + e);
  }

  try {
    var version1 = decrypted[0];
    var version2 = decrypted[1];
    var nonce = decrypted.slice(2, 10);
    var payload = decrypted.slice(10);
  } catch (e) {
    throw new Error('Cannot parse decrypted data: ' + e);
  }

  if (payload.length === 0) {
    throw new Error('No data present');
  }

  if (version1 !== 1) {
    throw new Error('Invalid version number');
  }

  if (version2 !== 0) {
    //put special version2 handling code here, if ever needed
  }

  if (!Message._noncegt(nonce, prevnonce) && prevnonce.toString('hex') !== '0000000000000000') {
    throw new Error('Nonce not equal to zero and not greater than the previous nonce');
  }

  var decoded = {
    version1: version1,
    version2: version2,
    nonce: nonce,
    payload: payload
  };

  return decoded;
};

//return true if nonce > prevnonce; false otherwise
Message._noncegt = function(nonce, prevnonce) {
  var noncep1 = nonce.slice(0, 4).readUInt32BE(0);
  var prevnoncep1 = prevnonce.slice(0, 4).readUInt32BE(0);

  if (noncep1 > prevnoncep1)
    return true;
  
  if (noncep1 < prevnoncep1)
    return false;

  var noncep2 = nonce.slice(4, 8).readUInt32BE(0);
  var prevnoncep2 = prevnonce.slice(4, 8).readUInt32BE(0);

  if (noncep2 > prevnoncep2)
    return true;

  return false;
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
