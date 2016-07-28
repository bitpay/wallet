describe('importController', function() {
  var walletService;
  var storeProfile;

  var fixtures = {
    '31f5deeef4cf7fd8fc67297179232e8e4590532960454ad958009132fef3daae': {},
    '4599136eff6deb4c9c78043fa84113617a16d75c45920d662305f6227ae8f0a0': {
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
          "id": "a9dcee10fe9c611300e6c7926ece20780f89b9a98baaa342928038b5503ed929",
          "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"wwZd+2LQgYR6cA==\"}",
          "xPubKey": "xpub6DRjAgkh3vGTWDcEmDp4TPwy48Nu8yrp6swCEdCCLL615CgnZon7r3vXYr8LYibMLJh5DriGSito1FRBwVoBkjD1ZWG4dmgiC935wLj3nQC",
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
      },
      "preferences": {},
      "pendingTxps": [],
      "balance": {
        "totalAmount": 0,
        "lockedAmount": 0,
        "totalConfirmedAmount": 0,
        "lockedConfirmedAmount": 0,
        "availableAmount": 0,
        "availableConfirmedAmount": 0,
        "byAddress": [],
        "totalBytesToSendMax": 0,
        "totalBytesToSendConfirmedMax": 0
      }
    }

  }; // TODO: Read from file

  beforeEach(function(done){
    mocks.init(fixtures, 'importController', {}, done);
  })

  afterEach(function(done){
    mocks.clear({}, done);
  });



  it('should be defined', function() {
    should.exist(ctrl);
  });

  it('should import a 1-1 wallet from mnemonic', function(done) {
    var fakeForm = {
      words: {
        $modelValue: 'legal winner thank year wave sausage worth useful legal winner thank yellow'
      },
      passphrase: {}
    };

    // FROM DATA
    scope.seedSource = {
      id: 'set'
    };
    scope.bwsurl = null;
    scope._walletPrivKey = 'Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy';

    scope.setSeedSource();

    scope.importMnemonic(fakeForm);
    should.not.exist(scope.error);

    mocks.notification.success.calledOnce.should.equal(true);

//    mocks.go.walletHome.calledOnce.should.equal(true);

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
