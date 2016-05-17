describe('index', function() {

  var walletService;

  var walletInfo = {
    "wallet": {
      "version": "1.0.0",
      "createdOn": 1463511645,
      "id": "7bd8d22f-d132-43e1-b259-d5b430752553",
      "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"70OA+k4+xTPxim+QSdDtA5/Cf055\"}",
      "m": 2,
      "n": 2,
      "status": "pending",
      "publicKeyRing": [],
      "copayers": [{
        "version": 2,
        "createdOn": 1463511988,
        "id": "3d4eb9b439eee1b2b73cf792eda52e420f4665109c7234a50cf3cdbf296ea8fb",
        "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"wwZd+2LQgYR6cA==\"}",
        "xPubKey": "xpub6CkPnrzSUp9qzBVM3hpo4oS2JKC6GJq6brE1yW59QrnhDpvkFLakpxUGRGXH62fiXb5S2VbnD4h2DLoCMfSkwfonbNgNYTJw9Ko5SqWEqCR",
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
  };

  var fixtures = {

    // Incomplete wallet status
    'd05582c35aa545494e3f3be9713efa9df112d36a324350f6b7141996b824bce2': walletInfo,
    // ^ same thing, twostep=1
    '56f430fcd3987d37d5818b1c0a716544c0115cd1b65e3bf163006b1823494ad2': walletInfo,
    // put /preferences
    '8fb7fc4644c3828a7df61185a08504c685df0867b21c6ad2a386d69bc3a1a568': {},
    //
    '980fad92e75cdfdfe59d139bf1f65ff3ccb7b0e56718637fd9de5842f7875312': {
      "version": "1.0.0",
      "createdOn": 1463520484,
      "walletId": "7bd8d22f-d132-43e1-b259-d5b430752553",
      "copayerId": "3d4eb9b439eee1b2b73cf792eda52e420f4665109c7234a50cf3cdbf296ea8fb",
      "email": null,
      "language": null,
      "unit": "bit"
    },
  };

  var incompleteWallet = {
    "network": "livenet",
    "xPrivKey": "xprv9s21ZrQH143K27bhzfejhNcitEAJgLKCfdLxwhr1FLu43FLqLwscAxXgmkucpF4k8eGmepSctkiQDbcR98Qd1bzSeDuR9jeyQAQEanPT2A4",
    "xPubKey": "xpub6CkPnrzSUp9qzBVM3hpo4oS2JKC6GJq6brE1yW59QrnhDpvkFLakpxUGRGXH62fiXb5S2VbnD4h2DLoCMfSkwfonbNgNYTJw9Ko5SqWEqCR",
    "requestPrivKey": "0cb89231b31dfaae9034ba794b9c48597eb573429f7b4b1f95e1945b22166bd5",
    "requestPubKey": "022941a5ecb8c7224f812ad6b03bd1c9bb77861080b21703eabe18ef9a72b48e72",
    "copayerId": "3d4eb9b439eee1b2b73cf792eda52e420f4665109c7234a50cf3cdbf296ea8fb",
    "publicKeyRing": [{
      "xPubKey": "xpub6CkPnrzSUp9qzBVM3hpo4oS2JKC6GJq6brE1yW59QrnhDpvkFLakpxUGRGXH62fiXb5S2VbnD4h2DLoCMfSkwfonbNgNYTJw9Ko5SqWEqCR",
      "requestPubKey": "022941a5ecb8c7224f812ad6b03bd1c9bb77861080b21703eabe18ef9a72b48e72"
    }],
    "walletId": "7bd8d22f-d132-43e1-b259-d5b430752553",
    "walletName": "A test wallet",
    "m": 2,
    "n": 2,
    "walletPrivKey": "Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy",
    "personalEncryptingKey": "1fgFP/uoLhVxJiMXOWQznA==",
    "sharedEncryptingKey": "FZIY4+p4TfBAKRclKtrROw==",
    "copayerName": "me",
    "mnemonic": "dizzy cycle skirt decrease exotic fork sure mixture hair vapor copper hero",
    "entropySource": "79e60ad83e04ee40967147fd6ac58f986c7dcf6c82b125fb4e8c30ff9f9584ee",
    "mnemonicHasPassphrase": false,
    "derivationStrategy": "BIP44",
    "account": 0,
    "addressType": "P2SH"
  };


  describe('Incomplete wallet', function() {
    beforeEach(function(done) {
      localStorage.setItem('profile', JSON.stringify({
        credentials: [incompleteWallet],
        createdOn: 1463519749,
        disclaimerAccepted: true,
      }));

      mocks.init(fixtures, 'indexController', {
        load: true
      }, done);
    });

    afterEach(function(done) {
      mocks.clear({}, done);
    });

    it('should be defined', function() {
      should.exist(ctrl);
    });
    it('should set the invitation code for incomplete wallets', function(done) {
      should.exist(ctrl);

      // should redirect to copayers
      mocks.go.path.getCall(0).args[0].should.equal('copayers');
      done();
    });
  });


});
