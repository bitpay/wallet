describe('createController', function() {
  var walletService;
  var storeProfile;

  var fixtures = {

    // createWallet
    'f0717760b3ff6606e6ab88df109f42186fbe84cf1b1c9d15c1d512910fd3aa89': {
      "walletId": "267bfa75-5575-4af7-8aa3-f5186bc99262"
    },
    // join
    'cd36f2e90826a0c7f03eb32faf06c81a44ef06947e5d2d2c64fc1d6fbbd191d7': {
      "copayerId": "a9dcee10fe9c611300e6c7926ece20780f89b9a98baaa342928038b5503ed929",
      "wallet": {
        "version": "1.0.0",
        "createdOn": 1463488747,
        "id": "267bfa75-5575-4af7-8aa3-f5186bc99262",
        "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"70OA+k4+xTPxim+QSdDtA5/Cf055\"}",
        "m": 1,
        "n": 1,
        "status": "complete",
        "publicKeyRing": [{
          "xPubKey": "xpub6DRjAgkh3vGTWDcEmDp4TPwy48Nu8yrp6swCEdCCLL615CgnZon7r3vXYr8LYibMLJh5DriGSito1FRBwVoBkjD1ZWG4dmgiC935wLj3nQC",
          "requestPubKey": "02befcc7499abcecf9608bb05e665f374434a89ca0c4e9baeab7dd28c027143458"
        }],
        "copayers": [{
          "version": 2,
          "createdOn": 1463490295,
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
    }



  }; // TODO: Read from file

  mocks.init(fixtures);

  it('should be defined', function() {
    should.exist(create);
  });

  it.only('should create a 1-1 wallet from mnemonic', function(done) {
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
    scope.privateKey = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
    scope._walletPrivKey = 'Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy';

    create.setSeedSource();
    create.create(fakeForm);

    should.not.exist(create.error);
    mocks.go.walletHome.calledOnce.should.equal(true);

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
});
