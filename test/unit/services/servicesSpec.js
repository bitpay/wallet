//
// test/unit/services/servicesSpec.js
//
//
//
var sinon = require('sinon');
var preconditions = require('preconditions').singleton();


describe("Angular services", function() {
  beforeEach(angular.mock.module('copayApp'));
  beforeEach(angular.mock.module('copayApp.services'));
  beforeEach(module(function($provide) {
    $provide.value('request', {
      'get': function(_, cb) {
        cb(null, null, [{
          name: 'USD Dollars',
          code: 'USD',
          rate: 2
        }]);
      }
    });
  }));


  beforeEach(inject(function($rootScope) {

    var w = {};
    w.isComplete = sinon.stub().returns(true);
    w.privateKey = {};
    w.settings = {
      unitToSatoshi: 100,
      unitDecimals: 2,
      alternativeName: 'US Dollar',
      alternativeIsoCode: 'USD',
    };
    w.addressBook = {
      'juan': '1',
    };
    w.balanceByAddr = [{
      'address1': 1
    }];

    w.totalCopayers = 2;
    w.getMyCopayerNickname = sinon.stub().returns('nickname');
    w.getMyCopayerId = sinon.stub().returns('id');
    w.privateKey.toObj = sinon.stub().returns({
      wallet: 'mock'
    });
    w.getSecret = sinon.stub().returns('secret');
    w.getName = sinon.stub().returns('fakeWallet');
    w.getId = sinon.stub().returns('id');
    w.exportEncrypted = sinon.stub().returns('1234567');
    w.getTransactionHistory = sinon.stub().yields({});
    w.getNetworkName = sinon.stub().returns('testnet');
    w.getAddressesInfo = sinon.stub().returns({});

    w.createTx = sinon.stub().yields(null);
    w.sendTx = sinon.stub().yields(null);
    w.requiresMultipleSignatures = sinon.stub().returns(true);
    w.getTxProposals = sinon.stub().returns([1, 2, 3]);
    $rootScope.wallet = w;
  }));




  describe("Unit: balanceService", function() {

    it('should updateBalance in bits', inject(function(balanceService, $rootScope) {
      var w = $rootScope.wallet;

      expect(balanceService.update).not.to.equal(null);
      var Waddr = Object.keys($rootScope.wallet.balanceByAddr)[0];
      var a = {};
      a[Waddr] = 200;
      w.getBalance = sinon.stub().yields(null, 100000001, a, 90000002, 5);


      //retuns values in DEFAULT UNIT(bits)
      balanceService.update(w, function() {
        var b = w.balanceInfo;
        expect(b.totalBalanceBTC).to.be.equal(1.00000001);
        expect(b.availableBalanceBTC).to.be.equal(0.90000002);
        expect(b.lockedBalanceBTC).to.be.equal(0.09999999);

        expect(b.totalBalance).to.be.equal('1,000,000.01');
        expect(b.availableBalance).to.be.equal('900,000.02');
        expect(b.lockedBalance).to.be.equal('99,999.99');

        expect(b.balanceByAddr[Waddr]).to.equal(2);
        expect(b.safeUnspentCount).to.equal(5);
        expect(b.topAmount).to.equal(899800.02);
      }, false);
    }));

  });

  describe("Unit: Notification Service", function() {
    it('should contain a notification service', inject(function(notification) {
      expect(notification).not.to.equal(null);
    }));
  });

  describe("Unit: identityService Service", function() {
    it('should contain a identityService service', inject(function(identityService) {
      expect(identityService).not.to.equal(null);
    }));
  });

  describe("Unit: pinService", function() {
    it('should contain a pinService service', inject(function(pinService) {
      expect(pinService).not.to.equal(null);
    }));
    it('should be able to check -> save -> get ->  clear -> check', function(done) {
      inject(function(pinService) {
        pinService.save('123', 'user', 'pass', function(err) {
          pinService.check(function(err, value) {
            should.not.exist(err);
            value.should.equal(true);
            pinService.get('123', function(err, data) {
              should.not.exist(err);
              data.email.should.be.equal('user');
              data.password.should.be.equal('pass');
              pinService.clear(function(err) {
                should.not.exist(err);
                pinService.check(function(err, value) {
                  should.not.exist(err);
                  value.should.equal(false);
                  done();
                });
              });
            });
          });
        })
      })
    });
  });

  describe("Unit: localstorageService", function() {
    it('should contain a localstorageService service', inject(function(localstorageService) {
      expect(localstorageService).not.to.equal(null);
    }));
  });


  describe("Unit: Backup Service", function() {
    it('should contain a backup service', inject(function(backupService) {
      expect(backupService).not.to.equal(null);
    }));
    it('should backup in file', inject(function(backupService) {
      var mock = sinon.mock(window);
      var expectation = mock.expects('saveAs');
      backupService._download({}, 'test');
      expectation.once();
    }));
  });

  describe("Unit: isMobile Service", function() {
    it('should contain a isMobile service', inject(function(isMobile) {
      expect(isMobile).not.to.equal(null);
    }));
    it('should not detect mobile by default', inject(function(isMobile) {
      isMobile.any().should.equal(false);
    }));
    it('should detect mobile if user agent is Android', inject(function(isMobile) {
      navigator.__defineGetter__('userAgent', function() {
        return 'Android 2.2.3';
      });
      isMobile.any().should.equal(true);
    }));
  });

  describe("Unit: uriHandler service", function() {
    it('should contain a uriHandler service', inject(function(uriHandler) {
      should.exist(uriHandler);
    }));
    it('should register', inject(function(uriHandler) {
      (function() {
        uriHandler.register();
      }).should.not.throw();
    }));
  });

  describe('Unit: Rate Service', function() {
    it('should be injected correctly', inject(function(rateService) {
      should.exist(rateService);
    }));
    it('should be possible to ask if it is available',
      inject(function(rateService) {
        should.exist(rateService.isAvailable);
      })
    );
    it('should be possible to ask for conversion from fiat',
      function(done) {
        inject(function(rateService) {
          rateService.whenAvailable(function() {
            (1e8).should.equal(rateService.fromFiat(2, 'USD'));
            done();
          });
        })
      }
    );
    it('should be possible to ask for conversion to fiat',
      function(done) {
        inject(function(rateService) {
          rateService.whenAvailable(function() {
            (2).should.equal(rateService.toFiat(1e8, 'USD'));
            done();
          });
        })
      }
    );
  });
});
