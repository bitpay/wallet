'use strict';

var           chai = require('chai'),
            assert = require('better-assert'),
             sinon = require('sinon'),
            should = chai.should(),
            expect = chai.expect,
       cryptoUtils = require('../../js/util/crypto');

describe('crypto utilities', function() {

  it('should decrypt what it encrypts', function() {

    var key = 'My secret key';
    var message = 'My secret message';
    var encrypted = cryptoUtils.encrypt(key, message);
    var decrypted = cryptoUtils.decrypt(key, encrypted);

    assert(decrypted === message);
  });

  it('should work with a salt', function() {

    var key = 'My secret key';
    var message = 'My secret message';
    var salt = 'My salt';
    var encrypted = cryptoUtils.encrypt(key, message, salt);
    var decrypted = cryptoUtils.decrypt(key, encrypted);

    assert(decrypted === message);
  });

  it('should return null if the provided key cant decrypt', function() {
    var key = 'My secret key';
    var message = 'My secret message';
    var encrypted = cryptoUtils.encrypt(key, message);
    var decrypted = cryptoUtils.decrypt('Invalid key', encrypted);

    assert(decrypted === null);
  });

  it('has a kdf function that is easy to use', function() {
    var password = 'My key';
    var key = cryptoUtils.kdf(password);

    assert(typeof key === 'string');
    assert(key.indexOf('{') === -1);
  });

});

