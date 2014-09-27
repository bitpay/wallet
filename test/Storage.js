'use strict';
var Storage = copay.Storage;

var fakeWallet = 'fake-wallet-id';
var timeStamp = Date.now();

describe('Storage model', function() {

  var s;
  beforeEach(function() {
    s = new Storage(requireMock('FakeLocalStorage').storageParams);
    s.setPassphrase('mysupercoolpassword');
    s.storage.clear();
    s.sessionStorage.clear();
  });


  it('should create an instance', function() {
    var s2 = new Storage(requireMock('FakeLocalStorage').storageParams);
    should.exist(s2);
  });
  it('should fail when encrypting without a password', function() {
    var s2 = new Storage(requireMock('FakeLocalStorage').storageParams);
    (function() {
      var params = _.clone(require('./mocks/FakeLocalStorage').storageParams);
      params.password = undefined;
      new Storage(params);
    }).should.throw('Illegal Argument');
  });
  it('should be able to encrypt and decrypt', function(done) {
    s._write(fakeWallet + timeStamp, 'value', function() {
      s._read(fakeWallet + timeStamp, function(v) {
        v.should.equal('value');
        done();
      });
    });
  });
  it('should be able to set a value', function(done) {
    s._write(fakeWallet + timeStamp, 1, function() {
      done();
    });
  });
  var getSetData = [
    1, 1000, -15, -1000,
    0.1, -0.5, -0.5e-10, Math.PI,
    'hi', 'auydoaiusyodaisudyoa', '0b5b8556a0c2ce828c9ccfa58b3dd0a1ae879b9b',
    '1CjPR7Z5ZSyWk6WtXvSFgkptmpoi4UM9BC', 'OP_DUP OP_HASH160 80ad90d4035', [1, 2, 3, 4, 5, 6], {
      x: 1,
      y: 2
    }, {
      x: 'hi',
      y: null
    }, {
      a: {},
      b: [],
      c: [1, 2, 'hi']
    },
    null
  ];
  getSetData.forEach(function(obj) {
    it('should be able to set a value and get it for ' + JSON.stringify(obj), function(done) {
      s._write(fakeWallet + timeStamp, obj, function() {
        s._read(fakeWallet + timeStamp, function(obj2) {
          JSON.stringify(obj2).should.equal(JSON.stringify(obj));
          done();
        });
      });
    });
  });

  describe('#export', function() {
    it('should export the encrypted wallet', function(done) {
      s._write(fakeWallet + timeStamp, 'testval', function() {
        var obj = {
          test: 'testval'
        };
        var encrypted = s.export(obj);
        encrypted.length.should.be.greaterThan(10);
        done();
      });
    });
  });

  describe('#_getWalletIds_Old', function() {
    it('should get wallet ids', function(done) {
      s._write('1::hola', 'juan', function() {
        s._write('2::hola', 'juan', function() {
          s._getWalletIds_Old(function(v) {
            v.should.deep.equal(['1', '2']);
            done();
          });
        });
      });
    });
  });

  describe('#getLastOpened #setLastOpened', function() {
    it('should get/set last opened', function() {
      s.setLastOpened('hey', function() {
        s.getLastOpened(function(v) {
          v.should.equal('hey');
        });
      });
    });
  });

  if (is_browser) {
    describe('#getSessionId', function() {
      it('should get SessionId', function(done) {
        s.getSessionId(function(sid) {
          should.exist(sid);
          s.getSessionId(function(sid2) {
            sid2.should.equal(sid);
            done();
          });
        });
      });
    });
  }

  describe('#getWallets1_Old', function() {
    it('should retrieve wallets from storage', function(done) {
      s._write('1::hola', 'juan', function() {
        s._write('2::hola', 'juan', function() {
          s.setGlobal('nameFor::1', 'hola', function() {

            s.getWallets1_Old(function(ws) {
              ws[0].should.deep.equal({
                id: '1',
                name: 'hola',
              });
              ws[1].should.deep.equal({
                id: '2',
                name: undefined
              });
              done();
            });
          });
        });
      });
    });
    it('should retrieve wallets from storage (with delay)', function(done) {
      s._write('1::hola', 'juan', function() {
        s._write('2::hola', 'juan', function() {
          s.setGlobal('nameFor::1', 'hola', function() {

            var orig = s.getGlobal.bind(s);
            s.getGlobal = function(k, cb) {
              setTimeout(function() {
                orig(k, cb);
              }, 1);
            };

            s.getWallets1_Old(function(ws) {
              ws[0].should.deep.equal({
                id: '1',
                name: 'hola',
              });
              ws[1].should.deep.equal({
                id: '2',
                name: undefined
              });
              done();
            });
          });
        });
      });
    });
  });

  describe('#getWallets2_Old', function() {
    it('should retrieve wallets from storage', function(done) {
      var w1 = {
        name: 'juan',
        opts: {
          name: 'wallet1'
        }
      };
      var w2 = {
        name: 'pepe'
      };
      s.setFromObj('wallet::1_wallet1', w1, function() {
        s.setFromObj('wallet::2', w2, function() {
          s.getWallets2_Old(function(ws) {
            ws[0].should.deep.equal({
              id: '1',
              name: 'wallet1',
            });
            ws[1].should.deep.equal({
              id: '2',
              name: undefined
            });
            done();
          });
        });
      });
    });
  });


  describe('#getWallets', function() {
    it('should retrieve wallets from storage both new and old format', function(done) {
      var w1 = {
        name: 'juan',
        opts: {
          name: 'wallet1'
        }
      };
      var w2 = {
        name: 'pepe'
      };

      s.setFromObj('wallet::1_wallet1', w1, function() {
        s.setFromObj('wallet::2', w2, function() {
          s._write('3::name', 'matias', function() {
            s._write('1::name', 'juan', function() {
              s.setGlobal('nameFor::3', 'wallet3', function() {
                s.getWallets_Old(function(ws) {
                  ws.length.should.equal(3);
                  ws[0].should.deep.equal({
                    id: '1',
                    name: 'wallet1',
                  });
                  ws[1].should.deep.equal({
                    id: '2',
                    name: undefined
                  });
                  ws[2].should.deep.equal({
                    id: '3',
                    name: 'wallet3',
                  });
                  done();
                });
              });
            });
          })
        });
      });
    });
  });

  describe('#deleteWallet_Old', function() {
    it('should fail to delete a unexisting wallet', function(done) {
      s._write('1::hola', 'juan', function() {
        s._write('2::hola', 'juan', function() {
          s.deleteWallet_Old('3', function(err) {
            err.toString().should.include('WNOTFOUND');
            done();
          });
        });
      });
    });

    it('should delete a wallet', function(done) {
      s._write('1::hola', 'juan', function() {
        s._write('2::hola', 'juan', function() {
          s.deleteWallet_Old('1', function(err) {
            should.not.exist(err);
            s.getWallets_Old(function(ws) {
              ws.length.should.equal(1);
              ws[0].should.deep.equal({
                id: '2',
                name: undefined
              });
              done();
            });
          });
        });
      });
    });
  });

  describe('#deleteWallet', function() {
    it('should fail to delete a unexisting wallet', function(done) {
      var w1 = {
        name: 'juan',
        opts: {
          name: 'wallet1'
        }
      };
      var w2 = {
        name: 'pepe'
      };

      s.setFromObj('wallet::1', w1, function() {
        s.setFromObj('wallet::2', w2, function() {
          s.deleteWallet('3', function(err) {
            err.toString().should.include('WNOTFOUND');
            done();
          });
        });
      });
    });

    it('should delete a wallet', function(done) {
      var w1 = {
        name: 'juan',
        opts: {
          name: 'wallet1'
        }
      };
      var w2 = {
        name: 'pepe'
      };

      s.setFromObj('wallet::1', w1, function() {
        s.setFromObj('wallet::2', w2, function() {
          s.deleteWallet('1', function(err) {
            should.not.exist(err);
            s.getWallets2_Old(function(ws) {
              ws.length.should.equal(1);
              ws[0].id.should.equal('2');
              done();
            });
          });
        });
      });
    });
  });

  describe('#readWallet_Old', function() {
    it('should read wallet', function(done) {
      var data = {
        'id1::a': 'x',
        'id1::b': 'y',
        'id2::c': 'z',
      };
      s.storage.allKeys = sinon.stub().yields(_.keys(data));
      sinon.stub(s, '_read', function(k, cb) {
        return cb(data[k]);
      });
      s.readWallet_Old('id1', function(err, w) {
        should.not.exist(err);
        w.should.exist;
        w.hasOwnProperty('a').should.be.true;
        w.hasOwnProperty('b').should.be.true;
        w.hasOwnProperty('c').should.be.false;
        w.a.should.equal('x');
        w.b.should.equal('y');
        s._read.restore();
        done();
      });
    });
  });

  describe('#getFirst', function() {
    it('should read first key', function(done) {
      var data = {
        'wallet::id1_wallet1': {
          a: 'x',
          b: 'y'
        },
        'wallet::id2': {
          c: 'z'
        },
      };
      s.storage.allKeys = sinon.stub().yields(_.keys(data));
      sinon.stub(s, '_read', function(k, cb) {
        return cb(data[k]);
      });
      s.getFirst('wallet::id1', function(err, w) {
        should.not.exist(err);
        w.should.exist;
        w.hasOwnProperty('a').should.be.true;
        w.hasOwnProperty('b').should.be.true;
        w.hasOwnProperty('c').should.be.false;
        w.a.should.equal('x');
        w.b.should.equal('y');
        s._read.restore();
        done();
      });
    });
  });

  describe('#setFromObj', function() {
    it('should store from an object as single key', function(done) {
      s.setFromObj('wallet::id1_nameid1', {
        'key': 'val',
        'opts': {
          'name': 'nameid1'
        },
      }, function() {
        s._read('wallet::id1_nameid1', function(r) {
          r.should.exist;
          r.key.should.exist;
          r.key.should.equal('val');
          r.opts.name.should.equal('nameid1');
          done();
        });
      });
    });
  });

  describe('#globals', function() {
    it('should set, get and remove keys', function(done) {
      s.setGlobal('a', {
        b: 1
      }, function() {
        s.getGlobal('a', function(v) {

          JSON.parse(v).should.deep.equal({
            b: 1
          });
          s.removeGlobal('a', function() {
            s.getGlobal('a', function(v) {
              should.not.exist(v);
              done();
            });
          });
        });
      });
    });
  });


  describe('session storage', function() {
    it('should get a session ID', function(done) {
      s.getSessionId(function(s) {
        should.exist(s);
        s.length.should.equal(16);
        (new Buffer(s, 'hex')).length.should.equal(8);
        done();
      });
    });
  });

  describe('#import', function() {
    it('should not be able to decrypt with wrong password', function() {
      s.setPassphrase('xxx');
      var wo = s.import(encryptedLegacy1);
      should.not.exist(wo);
    });

    it('should be able to decrypt an old backup', function() {
      s.setPassphrase(legacyPassword1);
      var wo = s.import(encryptedLegacy1);
      should.exist(wo);
      wo.opts.id.should.equal('48ba2f1ffdfe9708');
      wo.opts.spendUnconfirmed.should.equal(true);
      wo.opts.requiredCopayers.should.equal(1);
      wo.opts.totalCopayers.should.equal(1);
      wo.opts.name.should.equal('pepe wallet');
      wo.opts.version.should.equal('0.4.7');
      wo.publicKeyRing.walletId.should.equal('48ba2f1ffdfe9708');
      wo.publicKeyRing.networkName.should.equal('testnet');
      wo.publicKeyRing.requiredCopayers.should.equal(1);
      wo.publicKeyRing.totalCopayers.should.equal(1);
      wo.publicKeyRing.indexes.length.should.equal(2);
      JSON.stringify(wo.publicKeyRing.indexes[0]).should.equal('{"copayerIndex":2147483647,"changeIndex":0,"receiveIndex":1}');
      JSON.stringify(wo.publicKeyRing.indexes[1]).should.equal('{"copayerIndex":0,"changeIndex":0,"receiveIndex":1}');
      wo.publicKeyRing.copayersBackup.length.should.equal(1);
      wo.publicKeyRing.copayersBackup[0].should.equal('0298f65b2694c55f9048bc05f10368242727c7f9d2065cbd788c3ecde1ec57f33f');
      wo.publicKeyRing.copayersExtPubKeys.length.should.equal(1);
      wo.publicKeyRing.copayersExtPubKeys[0].should.equal('tpubD9SGoP7CXsqSKTiQxCZSCpicDcophqnE4yuqjfw5M9tAR3fSjT9GDGwPEUFCN7SSmRKGDLZgKQePYFaLWyK32akeSan45TNTd8sgef9Ymh6');
      wo.privateKey.extendedPrivateKeyString.should.equal('tprv8ZgxMBicQKsPfQCscb7CtJKzixxcVSyrCVcfr3WCFbtT8kYTzNubhjQ5R7AuYJgPCcSH4R8T34YVxeohKGhAB9wbB4eFBbQFjUpjGCqptHm');
      wo.privateKey.networkName.should.equal('testnet');
    });
  });
});

var legacyPassword1 = '1DUpLRbuVpgLkcEY8gY8iod/SmA7+OheGZJ9PtvmTlvNE0FkEWpCKW9STdzXYJqbn0wiAapE4ojHNYj2hjYYAQ==';
var encryptedLegacy1 = 'U2FsdGVkX19yGM1uBAIzQa8Po/dvUicmxt1YyRk/S97PcZ6I6rHMp9dMagIrehg4Qd6JHn/ustmFHS7vmBYj0EBpf6rdXiQezaWnVAJS9/xYjAO36EFUbl+NmUanuwujAxgYdSP/sNssRLeInvExmZYW993EEclxkwL6YUyX66kKsxGQo2oWng0NreBJNhFmrbOEWeFje2PiWP57oUjKsurFzwpluAAarUTYSLud+nXeabC7opzOP5yqniWBMJz0Ou8gpNCWCMhG/P9F9ccVPY7juyd0Hf41FVse8nd2++axKB57+paozLdO+HRfV6zkMqC3h8gWY7LkS75j3bvqcTw9LhXmzE0Sz21n9yDnRpA4chiAvtwQvvBGgj1pFMKhNQU6Obac9ZwKYzUTgdDn3Uzg1UlDzgyOh9S89rbRTV84WB+hXwhuVluWzbNNYV3vXe5PFrocVktIrtS3xQh+k/7my4A6/gRRrzNYpKrUASJqDS/9u9WBkG35xD63J/qXjtG2M0YPwbI57BK1IK4K510b8V72lz5U2XQrIC4ldBwni1rpSavwCJV9xF6hUdOmNV8fZsVHP0NeN1PYlLkSb2QgfuoWnkcsJerwuFR7GZC/i6efrswtpO0wMEQr/J0CLbeXlHAru6xxjCBhWoJvZpMGw72zgnDLoyMNsEVglNhx/VlV9ZMYkkdaEYAxPOEIyZdQ5MS+2jEAlXf818n/xzJSVrniCn9be8EPePvkw35pivprvy09vbW4cKsWBKvgIyoT6A3OhUOCCS8E9cg0WAjjav2EymrbKmGWRHaiD+EoJqaDg6s20zhHn1YEa/YwvGGSB5+Hg8baLHD8ZASvxz4cFFAAVZrBUedRFgHzqwaMUlFXLgueivWUj7RXlIw6GuNhLoo1QkhZMacf23hrFxxQYvGBRw1hekBuDmcsGWljA28udBxBd5f9i+3gErttMLJ6IPaud590uvrxRIclu0Sz9R2EQX64YJxqDtLpMY0PjddSMu8vaDRpK9/ZSrnz/xrXsyabaafz4rE/ItFXjwFUFkvtmuauHTz6nmuKjVfxvNLNAiKb/gI7vQyUhnTbKIApe7XyJsjedNDtZqsPoJRIzdDmrZYxGStbAZ7HThqFJlSJ9NPNhH+E2jm3TwL5mwt0fFZ5h+p497lHMtIcKffESo7KNa2juSVNMDREk0NcyxGXGiVB2FWl4sLdvyhcsVq0I7tmW6OGZKRf8W49GCJXq6Ie69DJ9LB1DO67NV1jsYbsLx9uhE2yEmpWZ3jkoCV/Eas4grxt0CGN6EavzQ==';
