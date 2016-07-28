describe('disclaimerController', function() {
  var walletService;
  var storeProfile;

  var fixtures = {
    'e4d8ae25e03e5fef2e553615b088cfce222083828c13fdb37b8b6cf87bf76236': {
      "walletId": "215f125d-57e7-414a-9723-448256113440",
    },
    '3f3b354d45c3eae3e4fe8830fcb728e5e570515af86e1a35deff0048a7a5e6b5': {
      "copayerId": "1a91ead1b6d13da882a25377a20e460df557e77008ea4f60eecbf984f786cf03",
      "wallet": {
        "version": "1.0.0",
        "createdOn": 1465347281,
        "id": "215f125d-57e7-414a-9723-448256113440",
        "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"/gaG7FIkhCiwsWKZUR0sL/cxH+zHMK0=\"}",
        "m": 1,
        "n": 1,
        "singleAddress": false,
        "status": "complete",
        "publicKeyRing": [{
          "xPubKey": "xpub6Cb7MYAX7mJR28MfFueCsoDVVHhoWkQxRC4viAeHanYwRNgDo5xMF42xmAeExzfyPXX3GaALNA8hWFMekVYvDF2BALommUhMgZ52szh88fd",
          "requestPubKey": "029a167eebe3ccd9987d41743477f8b75e1f3c30463187e1b106e0cc1155efa4dd"
        }],
        "copayers": [{
          "version": 2,
          "createdOn": 1465347281,
          "xPubKey": "xpub6Cb7MYAX7mJR28MfFueCsoDVVHhoWkQxRC4viAeHanYwRNgDo5xMF42xmAeExzfyPXX3GaALNA8hWFMekVYvDF2BALommUhMgZ52szh88fd",
          "id": "1a91ead1b6d13da882a25377a20e460df557e77008ea4f60eecbf984f786cf03",
          "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"wwZd+2LQgYR6cA==\"}",
          "requestPubKey": "029a167eebe3ccd9987d41743477f8b75e1f3c30463187e1b106e0cc1155efa4dd",
          "signature": "3045022100ac3f31ef145eabde6a125958aa9d63c2bd4aa27717d7f6905c3e3ff1e733ee8e02206a43200b775ee5c8f7a85c4d3309d155240d5de46a7d9c5e60045bf49779f40b",
          "requestPubKeys": [{
            "key": "029a167eebe3ccd9987d41743477f8b75e1f3c30463187e1b106e0cc1155efa4dd",
            "signature": "3045022100ac3f31ef145eabde6a125958aa9d63c2bd4aa27717d7f6905c3e3ff1e733ee8e02206a43200b775ee5c8f7a85c4d3309d155240d5de46a7d9c5e60045bf49779f40b"
          }],
          "customData": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"9l63hoVnA71LshCC5xbOTHA+ivBzux7u8SAci56p4aaVIF4qzXQhQKFX+sAFGfBjULm/E1st6awdXnxbAgjbF7D0zsbBFLFOSCw+ko5Xc6o=\"}"
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

    //========================================================
    // post wallets
    '3295ba1bcd509b7d42928c071999281f7692caa64df43177bec8a6a8c3fa8927': {
      "walletId": "24c40723-c360-498d-a803-a6e1e4ef990d"
    },
    // post /v2/wallets/24c40723-c360-498d-a803-a6e1e4ef990d/copayers
    '5f109ab9572a69feb0654268b8802afa364d6e8217aeaf851416f0394502e90c': {
      "copayerId": "6348201ef06ad5b922065fd4e510152c3da3af1196c0cb8f6e34f6e0494fa4a1",
      "wallet": {
        "version": "1.0.0",
        "createdOn": 1469713357,
        "id": "24c40723-c360-498d-a803-a6e1e4ef990d",
        "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"DK2ZgZ/k/rr5UfXn4Ht1KAAaRp7Wa5E=\"}",
        "m": 1,
        "n": 1,
        "singleAddress": false,
        "status": "complete",
        "publicKeyRing": [{
          "xPubKey": "xpub6D1Um62Uho1NDw6jYzgqCzase3L9TNLmCn42YuBzP8Vn4q94LwpNbcv3zpJJAS6BVf8YyKfKKqTt9BG9PBzcCbPouGkkci9qMNXTtZRmtAy",
          "requestPubKey": "03caa96ae18a6805f13851e6e3f08e15d505abb52cfde39427561587f5652245c1"
        }],
        "copayers": [{
          "version": 2,
          "createdOn": 1469713357,
          "xPubKey": "xpub6D1Um62Uho1NDw6jYzgqCzase3L9TNLmCn42YuBzP8Vn4q94LwpNbcv3zpJJAS6BVf8YyKfKKqTt9BG9PBzcCbPouGkkci9qMNXTtZRmtAy",
          "id": "6348201ef06ad5b922065fd4e510152c3da3af1196c0cb8f6e34f6e0494fa4a1",
          "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"Ma1tUjOpLrDtSA==\"}",
          "requestPubKey": "03caa96ae18a6805f13851e6e3f08e15d505abb52cfde39427561587f5652245c1",
          "signature": "3044022023b43a8dabfa3a2d615135913021bcd4cfe06739e76cdcec91dedcd93f1c034502200e62c491417874b3ef5d89bf2a9278c6bc1a3b95e7535bc0a6f936fffe1b11bd",
          "requestPubKeys": [{
            "key": "03caa96ae18a6805f13851e6e3f08e15d505abb52cfde39427561587f5652245c1",
            "signature": "3044022023b43a8dabfa3a2d615135913021bcd4cfe06739e76cdcec91dedcd93f1c034502200e62c491417874b3ef5d89bf2a9278c6bc1a3b95e7535bc0a6f936fffe1b11bd"
          }],
          "customData": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"cz7J7ySbR+GJqWheI9HYyoL+MquLmbUCQDCVS3ZyR24pHiDSq1rh3AxuHxgEIejq7oFeYdQc/eLzJFtTNe2bFm00N6w/hpa3RAm3PYpajfYYn3JH2JvFrCJYckQ=\"}"
        }],
        "pubKey": "03dcd6c9a8bc5109a62b0273e63cbf2e15bb65698e646d4713c85b2644551ce4f8",
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
    // post wallets
    '8563715db4f4822b4b2a97173093293f8c48e9468de76ef048b0fe3fb846c920': {
      "walletId": "65ffeffb-97f2-433d-ae04-8d28c1b96798"
    },
    // post copayers
    'fa2ecf7b36e3048da454284902ae3b97ffd9d86d0ccd72d36ff32bb8543cd4c1': {
      "copayerId": "e939fdf291091b5413f6682d2f1b7c2c3174face27139ec0e2fc8a9b172c2644",
      "wallet": {
        "version": "1.0.0",
        "createdOn": 1469713979,
        "id": "65ffeffb-97f2-433d-ae04-8d28c1b96798",
        "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"HGqck9Px9U26IE5uSKrlrp39t8WznEs=\"}",
        "m": 1,
        "n": 1,
        "singleAddress": false,
        "status": "complete",
        "publicKeyRing": [{
          "xPubKey": "xpub6CtArrqbWKXT1m2aF8nx3ZuDsyNGCFH54HCLxG3QRQuaeB1ciboT2KbVMdy3tzGuzc4A8iMxj4aQKmWjgXEjyfm5b8Vq8XXinRkTx3njjLC",
          "requestPubKey": "032965f65c6f8fefda40ff9ed1aaa66725db2d7e529210e4c5f1a02a66b3253077"
        }],
        "copayers": [{
          "version": 2,
          "createdOn": 1469713980,
          "xPubKey": "xpub6CtArrqbWKXT1m2aF8nx3ZuDsyNGCFH54HCLxG3QRQuaeB1ciboT2KbVMdy3tzGuzc4A8iMxj4aQKmWjgXEjyfm5b8Vq8XXinRkTx3njjLC",
          "id": "e939fdf291091b5413f6682d2f1b7c2c3174face27139ec0e2fc8a9b172c2644",
          "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"IWqHNixCmrWcWA==\"}",
          "requestPubKey": "032965f65c6f8fefda40ff9ed1aaa66725db2d7e529210e4c5f1a02a66b3253077",
          "signature": "304502210092ca3f8c481639913e2917350a7be9aa2fe84ca1becf3a16de6d3bd1e0c39b93022032df2c871c7f0b414fa83c7920582fbe3e2c83d3db76966d95d7a6002eb57291",
          "requestPubKeys": [{
            "key": "032965f65c6f8fefda40ff9ed1aaa66725db2d7e529210e4c5f1a02a66b3253077",
            "signature": "304502210092ca3f8c481639913e2917350a7be9aa2fe84ca1becf3a16de6d3bd1e0c39b93022032df2c871c7f0b414fa83c7920582fbe3e2c83d3db76966d95d7a6002eb57291"
          }],
          "customData": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"Oc30Rr5SMU6qbeSkF6pO+lfd7z7Ywyqhjqzzh6snyonLY34k6SmeLKCIb0rwYLOUBUdvWx3sY05qjYjcm/9xKPyTV8DSxLXc9EP6LE4B0dl1yvehARcFFq6ZcGE=\"}"
        }],
        "pubKey": "03be9b96960ebef82cb5fd9a0d0cbea17070819c3df6c39ca04b821a2b7642e938",
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

  beforeEach(function(done) {
    mocks.init(fixtures, 'disclaimerController', {
      initController: true,
      noDisclaimer: true,
    }, done);
  });

  afterEach(function(done) {
    mocks.clear({}, done);
  });

  it('should be defined', function() {
    should.exist(ctrl);
  });

  it.only('should create the initial profile', function(done) {
    localStorage.clear();
    ctrl.init({
      walletPrivKey: 'Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy',
      mnemonic: 'tunnel fork scare industry noble snow tank bullet over gesture nuclear next',
    });
    setTimeout(function() {
      mocks.ongoingProcess.set.getCall(1).args[0].should.equal('creatingWallet');
      mocks.ongoingProcess.set.getCall(1).args[1].should.equal(false);
      done();
    }, 10000);
  });
});
