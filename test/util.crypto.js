'use strict';

var cryptoUtils = require('../js/util/crypto');
var assert = require('assert');

describe('crypto utils', function() {

  it('should use pbkdf2 to generate a passphrase from password', function() {
    var salt = 'mjuBtGybi/4=';
    var iterations = 10;
    var pass = '123456';
    var passphrase = cryptoUtils.kdf(pass, salt, iterations);

    passphrase.toString().should.equal('IoP+EbmhibgvHAkgCAaSDL3Y73UvU96pEPkKtSb0Qazb1RKFVWR6fjkKGp/qBCImljzND3hRAws9bigszrqhfg==');
  });

  it('should decrypt what it encrypts', function() {

    var key = 'My secret key';
    var message = 'My secret message';
    var encrypted = cryptoUtils.encrypt(key, message);
    var decrypted = cryptoUtils.decrypt(key, encrypted);

    decrypted.should.equal(message);
  });

  it('should return null if the provided key cant decrypt', function() {
    var key = 'My secret key';
    var message = 'My secret message';
    var encrypted = cryptoUtils.encrypt(key, message);
    var decrypted = cryptoUtils.decrypt('Invalid key', encrypted);

    assert(decrypted === null);
  });

});
