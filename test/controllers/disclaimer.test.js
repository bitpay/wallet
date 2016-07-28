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
  }; // TODO: Read from file

  beforeEach(function(done) {

    mocks.init(fixtures, 'disclaimerController', {
      initController: true,
      noProfile: true,
    }, done);
  });

  afterEach(function(done) {
    mocks.clear({}, done);
  });

  it('should be defined', function() {
    should.exist(ctrl);
  });

  it('should create the initial profile', function(done) {
    localStorage.clear();
    ctrl.init({
      walletPrivKey: 'Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy',
      mnemonic: 'tunnel fork scare industry noble snow tank bullet over gesture nuclear next',
    });
    setTimeout(function() {
      mocks.ongoingProcess.set.getCall(1).args[0].should.equal('creatingWallet');
      mocks.ongoingProcess.set.getCall(1).args[1].should.equal(false);
      done();
    }, 100);
  });
});
