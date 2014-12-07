'use strict';

var cryptoUtils = copay.crypto;
var assert = require('assert');
describe('crypto utils', function() {

  it('should decrypt what it encrypts', function() {

    var key = 'My secret key';
    var message = 'My secret message';
    var encrypted = cryptoUtils.encrypt(key, message);
    var decrypted = cryptoUtils.decrypt(key, encrypted);

    decrypted.should.equal(message);
  });


  it('should decrypt what it encrypts (JSON)', function() {

    var key = 'My secret key';
    var message = {'hola': 'picho'};
    var encrypted = cryptoUtils.encrypt(key, message);
    var decrypted = cryptoUtils.decrypt(key, encrypted);

    JSON.parse(decrypted).should.deep.equal(message);
  });



  it('should return null if the provided key cant decrypt', function() {
    var key = 'My secret key';
    var message = 'My secret message';
    var encrypted = cryptoUtils.encrypt(key, message);
    var decrypted = cryptoUtils.decrypt('Invalid key', encrypted);

    assert(decrypted === null);
  });
 


  it('should sign a message', function() {
    var key = 'My secret key';
    var message = 'My secret message';
    var signature = cryptoUtils.hmac(key, message);
    signature.should.be.equal('6tpegxYl/Eig9k1Lla8b8G8OcdtOxyNbDsdyic1Yzh4=');
  });
 


  var tests = [
    {
    salt: 'mjuBtGybi/4=',
    iterations: 10,
    word: '123456',
    phrase: 'UUNLzkU5b2aT2/bIoyYwL3teyiFuRYEJtGCGQ0y0aEDciEtNCX0Wb73j4gmoCWl++epj6StBQg4SorTROZ2wFA==',
  },{
    salt: 'mjuBtGybi/4=',
    iterations: 5,
    word: '123456',
    phrase: '+3uClcHrIU52WGHPHBwbIDFirhbiIORYTDPs9xFLiXAkR2dEVN9gNoGtqhBPdi9U47tPkPoRqZtqXDaeetXflQ==',
  },{
    salt: 'asklhehuhug24',
    iterations: 5,
    word: '123456',
    phrase: 'lI82NmwibnUCHSQVQunv3aL0XCimZyFj/TZlHNIXV5Rzbf6TEj5L/335N/t7k2zUVub6XmMaWvufqmvSqA4znA==',
  }
  ];

  var test=0;
  _.each(tests,function(t){
    it('should generate a passphrase. Test case:' + test++,function(){
      var phrase = cryptoUtils.kdf(t.word, t.salt, t.iterations);
      phrase.should.equal(t.phrase);
    });
    it('should generate a passphrase from weird chars', function() {
      var phrase = cryptoUtils.kdf('Pwd123!@#$%^&*(){}[]\|/?.>,<=+-_`~åéþïœ’ä²¤þçæ¶', tests[0].salt, 100);
      var expected = 'CZwb5KdikvZHVsEoZUdJckAy+yyzGnd++XhyqxJXbc30'
                   + 'pEoO+WqHgqBbdf0gn2wiyWZv3zymB+7L75Xnz3uSlg==';
      phrase.should.equal(expected);
    });
  });
  it('should generate a passphrase using default salt/iter', function() {
    var phrase = cryptoUtils.kdf('Pwd123!@#$%^&*(){}[]\|/?.>,<=+-_`~åéþïœ’ä²¤þçæ¶');
    var expected = 'n9QYDBJvRCHfpAfp8X/Z1XDA00CnZtnehLKOVrtNYTLt9H+hlcyaZgbAGGgJ/dVRCsVtIBzYwaACNPckknMiCg==';
    phrase.should.equal(expected);
  });


});
