//
// test/unit/services/servicesSpec.js
//
//
//
var sinon = require('sinon');

beforeEach(function() {
  config.unitToSatoshi = 100;
  config.unitName = 'bits';
});

describe('Check config', function() {

  it('unit should be set to BITS in config.js', function() {
    expect(config.unitToSatoshi).to.equal(100);
    expect(config.unitName).to.equal('bits');
  });
});

describe("Unit: Walletfactory Service", function() {
  beforeEach(angular.mock.module('copayApp.services'));
  it('should contain a walletFactory service', inject(function(walletFactory) {
    expect(walletFactory).not.to.equal(null);
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
  describe("Unit: controllerUtils #updateGlobalAddresses", function() {


    it(' should call updateAddressList ', inject(function(controllerUtils, $rootScope) {
      $rootScope.wallet = new FakeWallet();
      var spy = sinon.spy(controllerUtils, 'updateAddressList');
      controllerUtils.updateGlobalAddresses();
      sinon.assert.callCount(spy, 1);
    }));

    it('should update addresses', inject(function(controllerUtils, $rootScope) {
      $rootScope.wallet = new FakeWallet();
      var Waddr = Object.keys($rootScope.wallet.balanceByAddr)[0];
      controllerUtils.updateGlobalAddresses();
      expect($rootScope.addrInfos[0].address).to.be.equal(Waddr);;
    }));
  });


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
describe("Unit: video service", function() {
  beforeEach(angular.mock.module('copayApp.services'));
  it('should contain a video service', inject(function(video) {
    should.exist(video);
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
