'use strict';

var Address = bitcore.Address;

var HDPath = copay.HDPath;
var PrivateKey = copay.PrivateKey;
var PublicKeyRing = copay.PublicKeyRing;

var aMasterPubKey = 'tprv8ZgxMBicQKsPdSVTiWXEqCCzqRaRr9EAQdn5UVMpT9UHX67Dh1FmzEMbavPumpAicsUm2XvC6NTdcWB89yN5DUWx5HQ7z3KByUg7Ht74VRZ';


var getNewEpk = function() {
  return new PrivateKey({
      networkName: 'livenet',
    })
    .deriveBIP45Branch()
    .extendedPublicKeyString();
}

var createW = function(networkName) {
  var config = {
    networkName: networkName || 'livenet',
  };

  var w = new PublicKeyRing(config);
  should.exist(w);

  var copayers = [];
  for (var i = 0; i < 5; i++) {
    w.isComplete().should.equal(false);
    w.remainingCopayers().should.equal(5 - i);
    var newEpk = w.addCopayer(getNewEpk());
    copayers.push(newEpk);
  }
  w.isComplete().should.equal(true);
  w.walletId = '1234567';

  return {
    w: w,
    copayers: copayers,
    pub: w.copayersHK[0].eckey.public.toString('hex')
  };
};

var cachedW;
var getCachedW = function() {
  if (!cachedW) {
    cachedW = createW();
  }
  return cachedW;
};

describe('PublicKeyRing model', function() {

  it('should create an instance (livenet)', function() {
    var config = {
      networkName: 'livenet',
    };

    var w = new PublicKeyRing({
      networkName: config.networkName
    });
    should.exist(w);
    w.network.name.should.equal('livenet');
  });
  it('should create an instance (testnet)', function() {
    var w2 = new PublicKeyRing();
    should.exist(w2);
    w2.network.name.should.equal('testnet');
  });

  it('should fail to generate shared pub keys wo extended key', function() {
    var config = {
      networkName: 'livenet',
    };
    var w2 = new PublicKeyRing(config);
    should.exist(w2);

    w2.registeredCopayers().should.equal(0);
    w2.isComplete().should.equal(false);

    (function() {
      w2.getAddress(0, false);
    }).should.throw();
  });

  it('should add and check when adding shared pub keys', function() {
    var k = getCachedW();
    var w = k.w;
    var copayers = k.copayers;

    w.isComplete().should.equal(true);
    w.addCopayer.should.throw();
    for (var i = 0; i < 5; i++) {
      (function() {
        w.addCopayer(copayers[i])
      }).should.throw();
    }
  });

  it('should be able to to store and read', function() {
    var k = getCachedW();
    var w = k.w;
    var copayers = k.copayers;
    var changeN = 2;
    var addressN = 2;
    var start = new Date().getTime();
    for (var i = 0; i < changeN; i++) {
      w.generateAddress(true, k.pub);
    }
    for (var i = 0; i < addressN; i++) {
      w.generateAddress(false, k.pub);
    }

    var data = w.toObj();
    should.exist(data);

    var w2 = PublicKeyRing.fromObj(data);
    w2.walletId.should.equal(w.walletId);
    w2.isComplete().should.equal(true);
    w2.addCopayer.should.throw();
    for (var i = 0; i < 5; i++) {
      (function() {
        w.addCopayer(copayers[i])
      }).should.throw();
    }

    w2.getHDParams(k.pub).getChangeIndex().should.equal(changeN);
    w2.getHDParams(k.pub).getReceiveIndex().should.equal(addressN);
  });


  it('should generate some p2sh addresses', function() {
    var k = getCachedW();
    var w = k.w;

    [true, false].forEach(function(isChange) {
      for (var i = 0; i < 2; i++) {
        var aStr = w.generateAddress(isChange, k.pub);
        var a= new bitcore.Address(aStr);
        a.isValid().should.equal(true);
        a.isScript().should.equal(true);
        a.network().name.should.equal('livenet');
        if (i > 1) {
          w.getAddress(i - 1, isChange).toString().should
            .not.equal(w.getAddress(i - 2, isChange).toString());
        }
      }
    });
  });

  it('caches calls to getAddress', function() {
    var setup = getCachedW();
    var pubkeyring = setup.w;

    var address = pubkeyring._getAddress(3, false, 4);

    pubkeyring.cache.addressToPath[address].should.equal("m/45'/4/0/3");
    _.indexOf(pubkeyring.cache.receiveAddresses,address).should.be.above(0);
    _.indexOf(pubkeyring.cache.changeAddresses,address).should.be.equal(-1);
  });

  it('should generate one address by default', function() {
    var k = createW();
    var w = k.w;
    var a = w.getAddresses();
    a.length.should.equal(1);
  });

  it('should generate one address by default', function() {
    var k = createW();
    var w = k.w;

    var a = w.getAddresses();
    a.length.should.equal(1);
    a = w.getAddresses();
    a.length.should.equal(1);
  });
 

  it('should generate 4+1 addresses', function() {
    var k = createW();
    var w = k.w;

    var a = w.getAddresses();
    a.length.should.equal(1);

    [true, false].forEach(function(isChange) {
      for (var i = 0; i < 2; i++) {
        w.generateAddress(isChange, k.pub);
      }
    });
  });

  it('should check isChange 4+1 addresses', function() {
    var k = createW();
    var w = k.w;
    var a = w.getAddresses();
    _.each(a, function(a, j) {
      var addr = new bitcore.Address(a);
      w.addressIsChange(a).should.equal([false, true, true, false, false][j]);
    });
  });


  it('should start with one shared address', function() {
    var k = createW();
    var a = k.w.getAddresses();
    a.length.should.equal(1);
  });

  it('should count generation indexes', function() {
    var k = createW();
    var w = k.w;

    for (var i = 0; i < 3; i++)
      w.generateAddress(true, k.pub);
    for (var i = 0; i < 2; i++)
      w.generateAddress(false, k.pub);

    w.getHDParams(k.pub).getChangeIndex().should.equal(3);
    w.getHDParams(k.pub).getReceiveIndex().should.equal(2);
  });

  it('#merge index tests', function() {
    var k = createW();
    var w = k.w;

    for (var i = 0; i < 2; i++)
      w.generateAddress(true, k.pub);
    for (var i = 0; i < 3; i++)
      w.generateAddress(false, k.pub);

    var w2 = new PublicKeyRing({
      networkName: 'livenet',
      walletId: w.walletId,
    });
    w2.merge(w).should.equal(true);
    w2.requiredCopayers.should.equal(3);
    w2.totalCopayers.should.equal(5);
    w2.getHDParams(k.pub).getChangeIndex().should.equal(2);
    w2.getHDParams(k.pub).getReceiveIndex().should.equal(3);

    w2.merge(w).should.equal(false);
  });


  it('#merge check tests', function() {
    var config = {
      networkName: 'livenet',
    };

    var w = new PublicKeyRing(config);
    w.walletId = 'lwjd5qra8257b9';
    var w2 = new PublicKeyRing({
      networkName: 'testnet', //wrong
      walletId: w.walletId,
    });
    (function() {
      w2.merge(w);
    }).should.throw();

    var w3 = new PublicKeyRing({
      networkName: 'livenet',
      walletId: w.walletId,
      requiredCopayers: 2, // wrong
    });
    (function() {
      w3.merge(w);
    }).should.throw();

    var w4 = new PublicKeyRing({
      networkName: 'livenet',
      walletId: w.walletId,
      totalCopayers: 3, // wrong
    });
    (function() {
      w4.merge(w);
    }).should.throw();


    var w6 = new PublicKeyRing({
      networkName: 'livenet',
    });
    (function() {
      w6.merge(w);
    }).should.throw();
    w.networkName = 'livenet';
    (function() {
      w6.merge(w);
    }).should.throw();


    var w0 = new PublicKeyRing({
      networkName: 'livenet',
    });

    for (var i = 0; i < 5; i++)
      w0.addCopayer(getNewEpk());

    (function() {
      w0.merge(w);
    }).should.throw();
    w.merge(w0, true).should.equal(true);
    w.isComplete().should.equal(true);

    var wx = new PublicKeyRing({
      networkName: 'livenet',
    });
    wx.addCopayer(getNewEpk());
    (function() {
      w.merge(wx);
    }).should.throw();
  });


  it('#merge pubkey tests', function() {
    var config = {
      networkName: 'livenet',
    };
    var copayers;
    var w = new PublicKeyRing(config);
    should.exist(w);
    copayers = [];
    for (var i = 0; i < 2; i++) {
      w.isComplete().should.equal(false);
      w.addCopayer(getNewEpk());
    }

    var w2 = new PublicKeyRing({
      networkName: 'livenet',
      id: w.id,
    });
    should.exist(w);
    copayers = [];
    for (var i = 0; i < 3; i++) {
      w2.isComplete().should.equal(false);
      w2.addCopayer(getNewEpk());
    }
    w2.merge(w).should.equal(true);
    w2.isComplete().should.equal(true);
    w2.merge(w).should.equal(false);

    w.isComplete().should.equal(false);
    w.merge(w2).should.equal(true);
    w.isComplete().should.equal(true);
    w.merge(w2).should.equal(false);
  });

  it('#merge pubkey tests (case 2)', function() {
    var config = {
      networkName: 'livenet',
    };
    var w = new PublicKeyRing(config);
    should.exist(w);

    for (var i = 0; i < 5; i++) {
      w.isComplete().should.equal(false);
      var w2 = new PublicKeyRing({
        networkName: 'livenet',
        id: w.id,
      });
      w2.addCopayer(getNewEpk());
      w.merge(w2).should.equal(true);
    }
    w.isComplete().should.equal(true);
  });


  it('#merge with nickname', function() {
    var config = {
      networkName: 'livenet',
    };
    var w = new PublicKeyRing(config);
    should.exist(w);
    for (var i = 0; i < 3; i++) {
      w.addCopayer(getNewEpk());
    };
    w._setNicknameForIndex(0, 'pepe0');
    w._setNicknameForIndex(1, 'pepe1');

    w.nicknameForIndex(0).should.equal('pepe0');
    w.nicknameForIndex(1).should.equal('pepe1');
    should.not.exist(w.nicknameForIndex(2));


    for (var i = 0; i < 2; i++) {
      w.isComplete().should.equal(false);
      var w2 = new PublicKeyRing({
        networkName: 'livenet',
        id: w.id,
      });
      w2.addCopayer(getNewEpk());
      w2._setNicknameForIndex(0, 'juan' + i);
      w.merge(w2).should.equal(true);
    }
    w.isComplete().should.equal(true);

    w.nicknameForIndex(0).should.equal('pepe0');
    w.nicknameForIndex(1).should.equal('pepe1');
    should.not.exist(w.nicknameForIndex(2));
    w.nicknameForIndex(3).should.equal('juan0');
    w.nicknameForIndex(4).should.equal('juan1');
  });

  it('#fromObj with error', function() {

    var config = {
      networkName: 'livenet',
    };
    var pkr = new PublicKeyRing(config);

    (function() {
      PublicKeyRing.fromObj(pkr);
    }).should.throw('format');
  });


  it('#toObj #fromObj with nickname', function() {
    var config = {
      networkName: 'livenet',
    };
    var w = new PublicKeyRing(config);
    should.exist(w);
    for (var i = 0; i < 3; i++) {
      w.addCopayer(getNewEpk(), 'tito' + i);
    };
    w.nicknameForIndex(0).should.equal('tito0');
    w.nicknameForIndex(1).should.equal('tito1');
    w.nicknameForIndex(2).should.equal('tito2');
    should.not.exist(w.nicknameForIndex(3));

    var o = JSON.parse(JSON.stringify(w.toObj()));
    var w2 = PublicKeyRing.fromObj(o);
    w2.nicknameForIndex(0).should.equal('tito0');
    w2.nicknameForIndex(1).should.equal('tito1');
    w2.nicknameForIndex(2).should.equal('tito2');
    should.not.exist(w2.nicknameForIndex(3));
  });


  it('#getHDParams should return the right one', function() {
    var config = {
      networkName: 'livenet',
    };
    var p = new PublicKeyRing(config);
    var i = p.getHDParams(HDPath.SHARED_INDEX);
    should.exist(i);
    i.copayerIndex.should.equal(HDPath.SHARED_INDEX);
  });

  it('#getHDParams should throw error', function() {
    var config = {
      networkName: 'livenet',
    };
    var p = new PublicKeyRing(config);

    (function badCosigner() {
      return p.getHDParams(54);
    }).should.throw();
  });

  it('#getRedeemScriptMap check tests', function() {
    var k = getCachedW();
    var w = k.w;
    var amount = 2;

    for (var i = 0; i < amount; i++)
      w.generateAddress(true, k.pub);
    for (var i = 0; i < amount; i++)
      w.generateAddress(false, k.pub);

    var m = w.getRedeemScriptMap([
      'm/45\'/2147483647/1/0',
      'm/45\'/2147483647/1/1',
      'm/45\'/2147483647/0/0',
      'm/45\'/2147483647/0/1'
    ]);
    Object.keys(m).length.should.equal(4);
    Object.keys(m).forEach(function(k) {
      should.exist(m[k]);
    });
  });

  it('#getForPath should return 5 pubkeys', function() {
    var w = getCachedW().w;
    var pubkeys = w.getForPath('m/45\'/2147483647/1/0');
    pubkeys.length.should.equal(5);
  });

  it('#getForPaths should return 2 arrays of 5 pubkey ', function() {
    var w = getCachedW().w;
    var pubkeys = w.getForPaths(['m/45\'/2147483647/1/0', 'm/45\'/2147483647/1/1']);
    pubkeys.length.should.equal(2);
    pubkeys[0].length.should.equal(5);
    pubkeys[1].length.should.equal(5);
  });

  it('#forPaths should return copayers and pubkeys ', function() {
    var w = getCachedW().w;
    var ret = w.forPaths(['m/45\'/2147483647/1/0', 'm/45\'/2147483647/1/1']);
    ret.copayerIds.length.should.equal(5);
    ret.pubKeys.length.should.equal(2);
    ret.pubKeys[0].length.should.equal(5);
    ret.pubKeys[1].length.should.equal(5);
  });

});
