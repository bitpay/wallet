'use strict';

var chai = chai || require('chai');
var should = chai.should();
var PrivateKey = require('../js/models/core/PrivateKey');
var PublicKeyRing = require('../js/models/core/PublicKeyRing');

describe('Performance tests', function() {
  describe('PrivateKey', function() {
    it('should optimize BIP32 private key gen time with cache', function() {
      var k1 = new PrivateKey();
      var generateN = 25;
      var generated = [];
      var start1 = new Date().getTime();
      for (var i = 0; i < generateN; i++) {
        var k = JSON.stringify(k1.get(i, false).storeObj());
        generated.push(k);
      }
      var delta1 = new Date().getTime() - start1;
      var backup = k1.toObj();
      var k2 = PrivateKey.fromObj(backup);
      var start2 = new Date().getTime();
      for (var i = 0; i < generateN; i++) {
        var k = JSON.stringify(k2.get(i, false).storeObj());
        generated[i].should.equal(k);
      }
      var delta2 = new Date().getTime() - start2;
      delta2.should.be.below(delta1);
    });
  });
  describe('PublicKeyRing', function() {
    var maxN = 7;
    for (var n = 1; n < maxN; n++) {
      for (var m = 1; m <= n; m++) {
        if ((m === 3 && n === 5) ||
          (m === 2 && n === 3)) {
          var M = m;
          var N = n;
          (function(M, N) {
            it('should optimize BIP32 publickey gen time with cache for ' + M + '-of-' + N, function() {
              var pkr1 = new PublicKeyRing({
                totalCopayers: N,
                requiredCopayers: M
              });
              for (var i = 0; i < N; i++) {
                pkr1.addCopayer(); // add new random ext public key
              }
              var generateN = 5;
              var generated = [];
              var start1 = new Date().getTime();
              for (var i = 0; i < generateN; i++) {
                var pubKeys = JSON.stringify(pkr1.getPubKeys(i, false));
                generated.push(pubKeys);
              }
              var delta1 = new Date().getTime() - start1;
              var backup = pkr1.toObj();
              var pkr2 = PublicKeyRing.fromObj(backup);
              var start2 = new Date().getTime();
              for (var i = 0; i < generateN; i++) {
                var pubKeys = JSON.stringify(pkr2.getPubKeys(i, false));
                generated[i].should.equal(pubKeys);
              }
              var delta2 = new Date().getTime() - start2;
              delta2.should.be.below(delta1);
            });
          })(M, N);
        }
      }
    }

  });
});
