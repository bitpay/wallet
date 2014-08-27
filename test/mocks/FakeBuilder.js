'use scrict';
var bitcore = bitcore || require('bitcore');
var Script = bitcore.Script;

var VALID_SCRIPTSIG_BUF = new Buffer('0048304502200708a381dde585ef7fdfaeaeb5da9b451d3e22b01eac8a5e3d03b959e24a7478022100c90e76e423523a54a9e9c43858337ebcef1a539a7fc685c2698dd8648fcf1b9101473044022030a77c9613d6ee010717c1abc494668d877e3fa0ae4c520f65cc3b308754c98c02205219d387bcb291bd44805b9468439e4168b02a6a180cdbcc24d84d71d696c1ae014cad532103197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d210380a29968851f93af55e581c43d9ef9294577a439a3ca9fc2bc47d1ca2b3e9127210392dccb2ed470a45984811d6402fdca613c175f8f3e4eb8e2306e8ccd7d0aed032103a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e32103e085eb6fa1f20b2722c16161144314070a2c316a9cae2489fd52ce5f63fff6e455ae','hex');

function Tx() {
  this.ins = [{s: VALID_SCRIPTSIG_BUF }];
};

Tx.prototype.getHashType = function() {
  return 1;
};

Tx.prototype.getNormalizedHash = function() {
  return '123456';
};
Tx.prototype.hashForSignature = function() {
  return new Buffer('31103626e162f1cbfab6b95b08c9f6e78aae128523261cb37f8dfd4783cb09a7', 'hex');
};

function FakeBuilder() {
  this.test = 1;
  this.tx = new Tx();
  this.signhash = 1;
  this.inputMap = [{ address: '2NDJbzwzsmRgD2o5HHXPhuq5g6tkKTjYkd6',
    scriptPubKey: new Script(new Buffer('a914dc0623476aefb049066b09b0147a022e6eb8429187', 'hex')),
    scriptType: 4,
    i: 0 }];

    this.vanilla = {
      scriptSig: [VALID_SCRIPTSIG_BUF],
    }    
}


FakeBuilder.prototype.merge  = function() {
};

FakeBuilder.prototype.build  = function() {
  return this.tx;
};


FakeBuilder.prototype.toObj  = function() {
  return this;
};
FakeBuilder.VALID_SCRIPTSIG_BUF = VALID_SCRIPTSIG_BUF;
module.exports = FakeBuilder;
