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


describe("Unit: Socket Service", function() {
  beforeEach(angular.mock.module('copayApp.services'));

  it('should contain a Socket service', inject(function(Socket) {
    expect(Socket).not.to.equal(null);
  }));


  it('Socket should support #on', inject(function(Socket) {
    expect(Socket.on).to.be.a('function');
  }));


  it('Socket should support #sysOn', inject(function(Socket) {
    expect(Socket.sysOn).to.be.a('function');
  }));


  it('Socket should add handlers with #on', inject(function(Socket) {
    Socket.on('a', function() {});
    Socket.on('b', function() {});
    Socket.sysOn('c', function() {});
    var ret = Socket.getListeners();
    expect(ret.a).to.be.equal(1);
    expect(ret.b).to.be.equal(1);
    expect(Object.keys(ret)).to.have.length(2);
  }));

  it('Socket should support block event', inject(function(Socket) {
    expect(Socket.isListeningBlocks()).to.be.false;
    Socket.on('block', function() {});
    expect(Socket.isListeningBlocks()).to.be.true;
    Socket.removeAllListeners();
    expect(Socket.isListeningBlocks()).to.be.false;
  }));

  it('Socket should support #removeAllListeners', inject(function(Socket) {
    Socket.on('a', function() {});
    Socket.on('b', function() {});
    Socket.sysOn('c', function() {});
    var ret = Socket.getListeners();
    expect(Object.keys(ret)).to.have.length(2);
    Socket.removeAllListeners();
    ret = Socket.getListeners();
    expect(Object.keys(ret)).to.have.length(0);
  }));
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
      expect($rootScope.totalBalance).to.be.equal(1000000.01);
      expect($rootScope.availableBalance).to.be.equal(900000.02);
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
  describe("Unit: controllerUtils #setSocketHandlers", function() {


    it(' should call updateAddressList ', inject(function(controllerUtils, $rootScope) {
      var spy = sinon.spy(controllerUtils, 'updateAddressList');
      controllerUtils.setSocketHandlers();
      sinon.assert.callCount(spy, 1);
    }));

    it('should update addresses', inject(function(controllerUtils, $rootScope) {
      $rootScope.wallet = new FakeWallet();
      var Waddr = Object.keys($rootScope.wallet.balanceByAddr)[0];
      controllerUtils.setSocketHandlers();
      expect($rootScope.addrInfos[0].address).to.be.equal(Waddr);;
    }));

    it('should set System Event Handlers', inject(function(controllerUtils, $rootScope, Socket) {
      var spy = sinon.spy(Socket, 'sysOn');
      $rootScope.wallet = new FakeWallet();
      controllerUtils.setSocketHandlers();
      sinon.assert.callCount(spy, 5);
      ['error', 'reconnect_error', 'reconnect_failed', 'connect', 'reconnect'].forEach(function(e) {
        sinon.assert.calledWith(spy, e);
      });
    }));

    it('should set Address Event Handlers', inject(function(controllerUtils, $rootScope, Socket) {
      var spy = sinon.spy(Socket, 'on');
      $rootScope.wallet = new FakeWallet();
      var Waddr = Object.keys($rootScope.wallet.balanceByAddr)[0];
      controllerUtils.setSocketHandlers();
      sinon.assert.calledWith(spy, Waddr);
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
