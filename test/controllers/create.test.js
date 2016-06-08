describe('createController', function() {
  var fixtures = {

    // Store prefs
    '1eda3e702196b8d5d82fae129249bc79f0d5be2f5309a4e39855e7eb4ad31428': {},
    '31f5deeef4cf7fd8fc67297179232e8e4590532960454ad958009132fef3daae': {},
    // createWallet 1-1
    //
    'b665ad8991c67f8f7e8ffb7e86c3b930fd3ff56c68eb6fd441bf374559cfe59c': {
        "walletId": "63d910e8-3e1b-4aac-97e9-aa0299a74c2c"
    },
    'd5cc6adebc752c154998f1c96af2b24e21e52dbd7c07008c333af03b905ffb85': {
      "copayerId": "a9dcee10fe9c611300e6c7926ece20780f89b9a98baaa342928038b5503ed929",
      "wallet": {
        "version": "1.0.0",
        "createdOn": 1465385318,
        "id": "63d910e8-3e1b-4aac-97e9-aa0299a74c2c",
        "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"70OA+k4+xTPxim+QSdDtA5/Cf055\"}",
        "m": 1,
        "n": 1,
        "singleAddress": false,
        "status": "complete",
        "publicKeyRing": [{
          "xPubKey": "xpub6DRjAgkh3vGTWDcEmDp4TPwy48Nu8yrp6swCEdCCLL615CgnZon7r3vXYr8LYibMLJh5DriGSito1FRBwVoBkjD1ZWG4dmgiC935wLj3nQC",
          "requestPubKey": "02befcc7499abcecf9608bb05e665f374434a89ca0c4e9baeab7dd28c027143458"
        }],
        "copayers": [{
          "version": 2,
          "createdOn": 1465385318,
          "xPubKey": "xpub6DRjAgkh3vGTWDcEmDp4TPwy48Nu8yrp6swCEdCCLL615CgnZon7r3vXYr8LYibMLJh5DriGSito1FRBwVoBkjD1ZWG4dmgiC935wLj3nQC",
          "id": "a9dcee10fe9c611300e6c7926ece20780f89b9a98baaa342928038b5503ed929",
          "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"wwZd+2LQgYR6cA==\"}",
          "requestPubKey": "02befcc7499abcecf9608bb05e665f374434a89ca0c4e9baeab7dd28c027143458",
          "signature": "3044022042e069126a42f1b9b498c315a825ef4fc9f4214156442651e4fef5c7678245e702205936045d7b22baa36ba36ef827cc3e5d542d57d9a1afb3a54080d12f0b95c67e",
          "requestPubKeys": [{
            "key": "02befcc7499abcecf9608bb05e665f374434a89ca0c4e9baeab7dd28c027143458",
            "signature": "3044022042e069126a42f1b9b498c315a825ef4fc9f4214156442651e4fef5c7678245e702205936045d7b22baa36ba36ef827cc3e5d542d57d9a1afb3a54080d12f0b95c67e"
          }],
          "customData": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"1Wjf2KvFkd5k0ypiiSNkSVXk7zdBOiTeCrwzPBI7fMQ/VqXUzrSB6gMGs9jISr+MvCaL1GJIXjaMnlQZNMR0lx/Pd1c6R/nKGBdHjKh0mlI=\"}"
        }],
        "pubKey": "026d95bb5cc2a30c19e22379ae78b4757aaa2dd0ccbd15a1db054fb50cb98ed361",
        "network": "livenet",
        "derivationStrategy": "BIP44",
        "addressType": "P2PKH",
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
    //createWallet 2-2
    '5a1d11ebc2a011f018b049de6b5c6b990cdc8e280644103f95a995321dbf0248': {
      "walletId": "2f50f598-7550-4e54-8032-15aa892309fb"
    },
    // join
    '58f2f3a6f11cd7dee9a75e026e3ba570c09b952bfea05f596fdb48e6ea323f21': {
      "copayerId": "3d4eb9b439eee1b2b73cf792eda52e420f4665109c7234a50cf3cdbf296ea8fb",
      "wallet": {
        "version": "1.0.0",
        "createdOn": 1465347188,
        "id": "2f50f598-7550-4e54-8032-15aa892309fb",
        "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"70OA+k4+xTPxim+QSdDtA5/Cf055\"}",
        "m": 2,
        "n": 2,
        "singleAddress": false,
        "status": "pending",
        "publicKeyRing": [],
        "copayers": [{
          "version": 2,
          "createdOn": 1465347188,
          "xPubKey": "xpub6CkPnrzSUp9qzBVM3hpo4oS2JKC6GJq6brE1yW59QrnhDpvkFLakpxUGRGXH62fiXb5S2VbnD4h2DLoCMfSkwfonbNgNYTJw9Ko5SqWEqCR",
          "id": "3d4eb9b439eee1b2b73cf792eda52e420f4665109c7234a50cf3cdbf296ea8fb",
          "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"wwZd+2LQgYR6cA==\"}",
          "requestPubKey": "022941a5ecb8c7224f812ad6b03bd1c9bb77861080b21703eabe18ef9a72b48e72",
          "signature": "30440220521623cf346f667658c00f1dea113407f23cecf02932c7dcb4b8bf35f1836b7a02202c77b8e4260942f4e13a58faae1f92e1130bae1157492056347e66741150eb2c",
          "requestPubKeys": [{
            "key": "022941a5ecb8c7224f812ad6b03bd1c9bb77861080b21703eabe18ef9a72b48e72",
            "signature": "30440220521623cf346f667658c00f1dea113407f23cecf02932c7dcb4b8bf35f1836b7a02202c77b8e4260942f4e13a58faae1f92e1130bae1157492056347e66741150eb2c"
          }],
          "customData": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"YJqN/LtkCY0cOB235RtbGEAY7wKGT0cUUpAvUeLkAUKz3/1axsYZtnG+PU0jHtwQvgmKNLkNcXNR60K+tyRpU0TG1z8pyx4gKwwD3Dt7KzA=\"}"
        }],
        "pubKey": "026d95bb5cc2a30c19e22379ae78b4757aaa2dd0ccbd15a1db054fb50cb98ed361",
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

  }; // TODO: Read from file

  beforeEach(function(done) {
    mocks.init(fixtures, 'createController', {}, done);
  })


  afterEach(function(done) {
    mocks.clear({}, done);
  });


  it('should be defined', function() {
    should.exist(ctrl);
  });

  it('should create a 1-1 wallet from mnemonic', function(done) {
    var fakeForm = {};

    // FROM DATA
    scope.seedSource = {
      id: 'set'
    };
    scope.requiredCopayers = 1;
    scope.totalCopayers = 1
    scope.walletName = 'A test wallet';
    scope.isTestnet = false;
    scope.bwsurl = null;
    scope.isSingleAddress = false;
    scope.privateKey = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
    scope._walletPrivKey = 'Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy';

    ctrl.setSeedSource();
    ctrl.create(fakeForm);

    should.not.exist(ctrl.error);
    mocks.go.walletHome.calledOnce.should.equal(true);
    //
    // check resulting profile
     storageService.getProfile(function(err, profile) {
       should.not.exist(err);
       var c = profile.credentials[0];
       c.network.should.equal('livenet');
       // from test vectors from https://dcpos.github.io/bip39/
       c.xPrivKey.should.equal('xprv9s21ZrQH143K2x4gnzRB1eZDq92Uuvy9CXbvgQGdvykXZ9mkkot6LBjzDpgaAfvzkuxJe9JKJXQ38VoPutxvACA5MsyoBs5UyQ4HZKGshGs');
       done();
     });
  });


  it('should create an incomplete 2-2 wallet from mnemonic', function(done) {
    var fakeForm = {};

    // FROM DATA
    scope.seedSource = {
      id: 'set'
    };
    scope.requiredCopayers = 2;
    scope.totalCopayers = 2;
    scope.walletName = 'A test wallet';
    scope.isTestnet = false;
    scope.bwsurl = null;
    scope.privateKey = 'dizzy cycle skirt decrease exotic fork sure mixture hair vapor copper hero';
    scope._walletPrivKey = 'Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy';

    ctrl.setSeedSource();
    ctrl.create(fakeForm);

    should.not.exist(ctrl.error);
    mocks.go.walletHome.calledOnce.should.equal(true, 'Go Wallet Home Called');

    // check resulting profile
    storageService.getProfile(function(err, profile) {
      should.not.exist(err);
      var c = profile.credentials[0];
      c.network.should.equal('livenet');
      // from test vectors from https://dcpos.github.io/bip39/
      c.xPrivKey.should.equal('xprv9s21ZrQH143K27bhzfejhNcitEAJgLKCfdLxwhr1FLu43FLqLwscAxXgmkucpF4k8eGmepSctkiQDbcR98Qd1bzSeDuR9jeyQAQEanPT2A4');
      // m/44'/0'/0'
      c.xPubKey.should.equal('xpub6CkPnrzSUp9qzBVM3hpo4oS2JKC6GJq6brE1yW59QrnhDpvkFLakpxUGRGXH62fiXb5S2VbnD4h2DLoCMfSkwfonbNgNYTJw9Ko5SqWEqCR');
      done();
    });
  });

});
