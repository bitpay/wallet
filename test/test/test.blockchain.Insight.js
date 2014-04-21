'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('bitcore');
var copay          = copay || require('../copay');
var Insight        = copay.Insight || require('../js/models/blockchain/Insight');

var ID = '933bf321393459b7';
var copayers = [
  'tpubD6NzVbkrYhZ4WeSS3M5axcR1EMYPeerA8GozBmYVLKSjriMXhse1C4kiLJMvaaDKRBaP7iSJJo5wMBh3JSYcMz1vrwXKKnAgtt4V4pfSEcq',
  'tpubD6NzVbkrYhZ4XPjvz7c2544jPBY2WKCJVCETEE68ykBLMcE7J3GVDGvmPEdzvTWWXxQsE25rm7f4J1ZNxzWhuR7iEhX1m4dS9HrYbg1ezUP',
  'tpubD6NzVbkrYhZ4YTRVfKf1tHgydyvoEWdsBRVCG6odCZdpY7nPZWxA26sLPtyHkquzHmgdAH8HpftobnJJUvcbi7MyHVqXmPLJCW9KCS6rkw8',
  'tpubD6NzVbkrYhZ4XDY86vJmcCUuUvbqujhM633a5ih8b6ngm1AsskGz3orGkjvbzcJNQUJSK9jqggRwSohq3LAigwWZ8uzGNrGZqCwaE95foAj',
  'tpubD6NzVbkrYhZ4XGHkbBTx4kU5w7RDb9hWXyK9tuEaYrY9SJUWBCUxrcMFkqBa6qAv11FNdVJ4MFxKdnKnjoBWDY6SwBtmP83gjFHTV5zz4RW'
];
var addresses = [
  '2NATQJnaQe2CUKLyhL1zdNkttJM1dUH9HaM',
  '2NE9hTCffeugo5gQtfB4owq98gyTeWC56yb', // 41btc
  '2N9D5bcCQ2bPWUDByQ6Qb5bMgMtgsk1rw3x', // 50btc
  '2NBEAi14f3xhwmGs9omEgKUwsW84BkzLp7S',
  '2N3RhiBW4ssXJnEbPjBCYThJHhEHQWAapf6',
  '2Mvn2Duvw8cdHs5AB8ZLXfoef1a71UrDr4W',
  '2NFjCBFZSsxiwWAD7CKQ3hzWFtf9DcqTucY',
  '2N9EdxU3co5XKTyj3yhFBeU3qw3EM1rrgzE' 
];

var unspent = [
  {
    address: "2NE9hTCffeugo5gQtfB4owq98gyTeWC56yb",
    txid: "d5597c6cf7f72507af63a4d5a2f9f84edb45fb42452cc8c514435b7a93158915",
    vout: 0,
    ts: 1397050347,
    scriptPubKey: "a914e54f125244a0bf91f9c5d861dc28343ccf19883d87",
    amount: 41,
    confirmations: 7007
  },
  {
    address: "2N9D5bcCQ2bPWUDByQ6Qb5bMgMtgsk1rw3x",
    txid: "90d0e1f993fc41596e7b0a7a3be8ef65d606164e13ce538bd3f48136b60eff5a",
    vout: 0,
    ts: 1397070106,
    scriptPubKey: "a914af1a2d1a9c0fa172ed70bc1c50ea6b66994e9abf87",
    amount: 50,
    confirmations: 6728
  }
];

var rawtx = '01000000010c2a03ed71ee18148e8c99c5ff66d5ffb75e5def46cdea2acc6f30103f33bfb5010000006a47304402207f960aeefdfad270dd77d1acca7af17d3a2e47e2059034ff5d6305cf63635e1d02202f061ee196cc4459cdecae6559beac696a9ecde9a17520849f319fa2a627e64f012103870465f9b4efb90b5d186a7a5eacd7081e601020dacd68d942e5918a56ed0bfcffffffff02a086010000000000ad532102a9495c64323cd8c3354dbf0b3400d830ee680da493acbccc3c2c356d1b20fabf21028233cf8bc6112ae2c36468bd447732c5586b52e1ba3284a2319cadfac6367f99210279fd856e5ed13ab6807e85ed7c0cd6f80613be042240fd731c43f5aba3dcae9821021380858a67a4f99eda52ce2d72c300911f9d3eb9d7a45102a2133f14f7b2dc14210215739b613ce42106a11ce433342c13c610bf68a1bc934f607ad7aeb4178e04cf55ae2044d200000000001976a9146917322f0010aaf7ec136a34b476dfc5eb7a331288ac00000000';

describe('Insight model', function() {

  it('should create an instance', function () {
    var w = new Insight();
    should.exist(w);
  });
  it.skip('should return array of unspent output', function(done) {
    var w = new Insight();
    w.listUnspent(addresses, function(a) {
      should.exist(a);
      done();
    });
  });
  it.skip('should return txid', function (done) {
    var w = new Insight();
    w.sendRawTransaction(rawtx, function(a) { 
      should.exist(a);
      done();
    });
  });
});
  
