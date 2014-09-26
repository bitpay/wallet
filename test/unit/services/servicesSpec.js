//
// test/unit/services/servicesSpec.js
//
//
//
var sinon = require('sinon');
var preconditions = require('preconditions').singleton();

beforeEach(angular.mock.module('copayApp'));

describe("Unit: Walletfactory Service", function() {
  beforeEach(angular.mock.module('copayApp.services'));
  it('should contain a identity service', inject(function(identity) {
    expect(identity).not.to.equal(null);
  }));
});

describe("Unit: controllerUtils", function() {
  beforeEach(angular.mock.module('copayApp.services'));

  it('should updateBalance in bits', inject(function(controllerUtils, $rootScope) {
    expect(controllerUtils.updateBalance).not.to.equal(null);
    scope = $rootScope.$new();

    $rootScope.wallet = new FakeWallet();
    var Waddr = Object.keys($rootScope.wallet.balanceByAddr)[0];
    var a = {};
    a[Waddr] = 100;
    //SATs
    $rootScope.wallet.set(100000001, 90000002, a);

    //retuns values in DEFAULT UNIT(bits)
    controllerUtils.updateBalance(function() {
      expect($rootScope.totalBalanceBTC).to.be.equal(1.00000001);
      expect($rootScope.availableBalanceBTC).to.be.equal(0.90000002);
      expect($rootScope.lockedBalanceBTC).to.be.equal(0.09999999);

      expect($rootScope.totalBalance).to.be.equal(1000000.01);
      expect($rootScope.availableBalance).to.be.equal(900000.02);
      expect($rootScope.lockedBalance).to.be.equal(99999.99);

      expect($rootScope.addrInfos).not.to.equal(null);
      expect($rootScope.addrInfos[0].address).to.equal(Waddr);
    });
  }));

  it('should set the rootScope', inject(function(controllerUtils, $rootScope) {
    controllerUtils.setupRootVariables(function() {
      expect($rootScope.txAlertCount).to.be.equal(0);
      expect($rootScope.insightError).to.be.equal(0);
      expect($rootScope.isCollapsed).to.be.equal(0);
      expect($rootScope.unitName).to.be.equal('bits');
    });
  }));
});

describe("Unit: Notification Service", function() {
  beforeEach(angular.mock.module('copayApp.services'));
  it('should contain a notification service', inject(function(notification) {
    expect(notification).not.to.equal(null);
  }));
});

describe("Unit: Backup Service", function() {
  beforeEach(angular.mock.module('copayApp.services'));
  it('should contain a backup service', inject(function(backupService) {
    expect(backupService).not.to.equal(null);
  }));
  it('should backup in file', inject(function(backupService) {
    var mock = sinon.mock(window);
    var expectation = mock.expects('saveAs');
    backupService.download(new FakeWallet());
    expectation.once();
  }));
});

describe("Unit: isMobile Service", function() {
  beforeEach(angular.mock.module('copayApp.services'));
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
  beforeEach(angular.mock.module('copayApp.services'));
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
  beforeEach(angular.mock.module('copayApp.services'));
  it('should be injected correctly', inject(function(rateService) {
    should.exist(rateService);
  }));
  it('should be possible to ask if it is available',
    inject(function(rateService) {
      should.exist(rateService.isAvailable);
    })
  );
  beforeEach(module(function($provide) {
    $provide.value('request', {
      'get': function(_, cb) {
        cb(null, null, [{
          name: 'lol currency',
          code: 'LOL',
          rate: 2
        }]);
      }
    });
  }));
  it('should be possible to ask for conversion from fiat',
    function(done) {
      inject(function(rateService) {
        rateService.whenAvailable(function() {
          (1e8).should.equal(rateService.fromFiat(2, 'LOL'));
          done();
        });
      })
    }
  );
  it('should be possible to ask for conversion to fiat',
    function(done) {
      inject(function(rateService) {
        rateService.whenAvailable(function() {
          (2).should.equal(rateService.toFiat(1e8, 'LOL'));
          done();
        });
      })
    }
  );
});
