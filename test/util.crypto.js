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

  it('should return null if the provided key cant decrypt', function() {
    var key = 'My secret key';
    var message = 'My secret message';
    var encrypted = cryptoUtils.encrypt(key, message);
    var decrypted = cryptoUtils.decrypt('Invalid key', encrypted);

    assert(decrypted === null);
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
      var phrase = cryptoUtils.kdf('Pwd123!@#$%^&*(){}[]\|/?.>,<=+-_`~åéþïœ’ä²¤þçæ¶');
    });
  });


});
