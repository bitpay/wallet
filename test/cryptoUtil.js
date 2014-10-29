'use strict';

var _ = require('lodash');
var chai = chai || require('chai');
var sinon = sinon || require('sinon');
var should = chai.should();
var crypto = require('../js/util/crypto.js');

describe('cryptoUtil', function() {

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
      var phrase = crypto.kdf(t.word, t.salt, t.iterations);
      phrase.should.equal(t.phrase);
    });
  });
});
 
