describe('joinController', function() {

  var walletService;

  var fixtures = {
    // join
    '668623e51aaae25c637fb9c57bb30a169a0ff67fa1e67e6e61643c7e5e580a66': {
      "copayerId": "962fb5dd31d9f715efdbb33d41533d272bb6c2ecd28bbb8181358f86b08253dd",
      "wallet": {
        "version": "1.0.0",
        "createdOn": 1466006460,
        "id": "10387ed3-51cf-43b4-91fe-ad85ca2ae368",
        "name": "{\"iv\":\"4Agx234j4p+TQS0QXj7bow==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"IEohefHXl/tr4rA=\"}",
        "m": 2,
        "n": 2,
        "singleAddress": false,
        "status": "complete",
        "publicKeyRing": [{
          "xPubKey": "xpub6C6dynsH56i7VhzHzo2ZcJguHsjYuUuoPcAdku8h6c7ZaJSYb4WQjKcGdggbpWEuaQspY3LHmFUoCQhk1ErmdegXnsJeSxoKqiPD1CUxVvT",
          "requestPubKey": "0200fbedb7d04af9edbd1602103c1ff68454fd009fd8b1acd957441e776c69ff59"
        }, {
          "xPubKey": "xpub6BsR71KDdSPMePtuipRiWKMC2Q9XEXfk6WM1trbJzPEhcwVBKyN9UhWtpnGv2pu4mtZyKFRgwL98hDH6TBdeEFNVp8Jf81kPBKPeWpn4sWr",
          "requestPubKey": "02ad777ba00bf085a2d167c0600df290037d40e5e0d33b5f8e345b0b80a8861bd4"
        }],
        "copayers": [{
          "version": 2,
          "createdOn": 1466006460,
          "id": "4f72d7bc290a0343a5096cf28999d5d329a9be42651b061fb9489130d0cf9af9",
          "name": "{\"iv\":\"RZr7/0eA7F70T/wBCJo7kw==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"nL4c40ADLWELtoE=\"}",
          "xPubKey": "xpub6C6dynsH56i7VhzHzo2ZcJguHsjYuUuoPcAdku8h6c7ZaJSYb4WQjKcGdggbpWEuaQspY3LHmFUoCQhk1ErmdegXnsJeSxoKqiPD1CUxVvT",
          "requestPubKey": "0200fbedb7d04af9edbd1602103c1ff68454fd009fd8b1acd957441e776c69ff59",
          "signature": "304402200af094bbb7c432c9a1323534db125431c87bdec9678f40e89a42f209115a222202207a87a27b5f14bf931e1a15d71aa8407118398e5540a8fcbaf7caffef534b6a49",
          "requestPubKeys": [{
            "key": "0200fbedb7d04af9edbd1602103c1ff68454fd009fd8b1acd957441e776c69ff59",
            "signature": "304402200af094bbb7c432c9a1323534db125431c87bdec9678f40e89a42f209115a222202207a87a27b5f14bf931e1a15d71aa8407118398e5540a8fcbaf7caffef534b6a49"
          }],
          "customData": "{\"iv\":\"kSIFrEhNScxUNG5BMnV34A==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"strUeMXiPhTPmsatrStRfaF9+ZD1LU+m+I6Xeu4m0s43DIqc/DYJwm+37fatohNKQ6J7FQKTCJUgMiidAe30K6Dw7J7GA6mFhedMsGLJNbOmBEhRN0AAbwXW6B0=\"}"
        }, {
          "version": 2,
          "createdOn": 1466006511,
          "xPubKey": "xpub6BsR71KDdSPMePtuipRiWKMC2Q9XEXfk6WM1trbJzPEhcwVBKyN9UhWtpnGv2pu4mtZyKFRgwL98hDH6TBdeEFNVp8Jf81kPBKPeWpn4sWr",
          "id": "962fb5dd31d9f715efdbb33d41533d272bb6c2ecd28bbb8181358f86b08253dd",
          "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"UKYkKqeia8gWrLqaJ+TuzA/LVlrG\"}",
          "requestPubKey": "02ad777ba00bf085a2d167c0600df290037d40e5e0d33b5f8e345b0b80a8861bd4",
          "signature": "3045022100f7c7bbc49ce679e67420db8614bf59dfbd798e8ad95a0427305ae5008e0aa41b02203997647b80cc6e5a365048dc5b7b1822809b3c9209a053aaeef7e9f3920d7cef",
          "requestPubKeys": [{
            "key": "02ad777ba00bf085a2d167c0600df290037d40e5e0d33b5f8e345b0b80a8861bd4",
            "signature": "3045022100f7c7bbc49ce679e67420db8614bf59dfbd798e8ad95a0427305ae5008e0aa41b02203997647b80cc6e5a365048dc5b7b1822809b3c9209a053aaeef7e9f3920d7cef"
          }],
          "customData": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"HTlgRDT46ysMT3+XzhxeXgrOfJ1Fq+kiTWG/q7RqISdWWE+cmP5LcI6+PSysEpo66AjOlI9ofyMVxKtptabWYSNgydrhnqZ5EKY0TnFRq8Ov7a8+btXf9n9BDsM=\"}"
        }],
        "pubKey": "03bdebf86549b272addd61076e026d2f6a225db514f08b8fad08536a8c4a6792c1",
        "network": "livenet",
        "derivationStrategy": "BIP44",
        "addressType": "P2SH",
        "addressManager": {
          "version": 2,
          "derivationStrategy": "BIP44",
          "receiveAddressIndex": 0,
          "changeAddressIndex": 0,
          "copayerIndex": 2147483647
        },
        "scanStatus": null
      }
    },

    '197031879d401f75c308e3d5014ac2e9560ec805e1fdd58c778e0ae0bfe7ec0a': {},
  }

  beforeEach(function(done) {
    mocks.init(fixtures, 'joinController', {}, done);
  })


  afterEach(function(done) {
    mocks.clear({}, done);
  });



  it('should be defined', function() {
    should.exist(ctrl);
  });

  //   // Get html template from cache
  // beforeEach(inject(function($templateCache) {  
  //   viewHtml = $templateCache.get("some/valid/templateUrl");
  // }));
  //   // beforeEach(inject(function(_$compile_, _$rootScope_){  
  //   $compile = _$compile_;
  //   $rootScope = _$rootScope_;
  //
  //   $scope = $rootScope.$new();
  //   $scope.user = {};
  //   $scope.logout = sinon.stub();
  //   dropdownElement = angular.element(viewHtml);
  // }));

  it('should join a wallet once the form is submitted', function(done) {
    // View' s joinForm is not available
    //join.onQrCodeScanned('aQRCode');
    //



    scope.seedSource = {
      id: 'set'
    };
    ctrl.setSeedSource();

    // FROM DATA
    scope._walletPrivKey = 'Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy';
    var fakeForm = {
      secret: {
        $modelValue: '31B6DG8f12vGhG7hWhQy2PKwngiNnQ4ijPcePSwanQ2gD6N4mWs3eVPtdwZqRQbHnLQyxhoJksL'
      },
      myName: {
        $modelValue: 'myCopayerName'
      },

      bwsurl: 'null',
      createPassphrase: {
        $modelValue: null
      },
      privateKey: {
        $modelValue: 'useful poet rely letter cause fat student tumble animal toddler proof husband',
      },
      passphrase: {
        $modelValue: null,
      },
    };
    ctrl.join(fakeForm);
    should.not.exist(ctrl.error);
    mocks.go.walletHome.calledOnce.should.equal(true, 'Go Wallet Home Called');

    // check resulting profile
    storageService.getProfile(function(err, profile) {
      should.not.exist(err);
      var c = profile.credentials[0];
      c.network.should.equal('livenet');
      // from test vectors from https://dcpos.github.io/bip39/
      c.xPrivKey.should.equal('xprv9s21ZrQH143K3ettHXncETrbUjzrTB7yBfhzjnYjbFgExeNMecTGPvJgje2WQeSFS17Sd8ssz8FQuCbm4rK62ojAwPCX8GHtjHNHsmJsbUa');
      // m/44'/0'/0'
      c.xPubKey.should.equal('xpub6BsR71KDdSPMePtuipRiWKMC2Q9XEXfk6WM1trbJzPEhcwVBKyN9UhWtpnGv2pu4mtZyKFRgwL98hDH6TBdeEFNVp8Jf81kPBKPeWpn4sWr');
      c.walletName.should.equal('2-2');
      done();
    });

  });
});
