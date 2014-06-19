//
// test/unit/services/servicesSpec.js
//
//
//
var sinon = require('sinon');

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
    var addr = '1CjPR7Z5ZSyWk6WtXvSFgkptmpoi4UM9BC';
    var a = {};
    a[addr] = 100;
    //SATs 
    $rootScope.wallet.set(100000001, 90000002, a);

    //retuns values in DEFAULT UNIT(bits)
    controllerUtils.updateBalance(function() {
      expect($rootScope.totalBalanceBTC).to.be.equal('1.0000');
      expect($rootScope.availableBalanceBTC).to.be.equal('0.9000');
      expect($rootScope.totalBalance).to.be.equal(1000000.01);
      expect($rootScope.availableBalance).to.be.equal(900000.02);
      expect($rootScope.addrInfos).not.to.equal(null);
      expect($rootScope.addrInfos[0].address).to.equal(addr);
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
  it('should backup by email', inject(function(backupService) {
    var mock = sinon.mock(window);
    var expectation = mock.expects('open');
    backupService.sendEmail('fake@test.com', new FakeWallet());
    expectation.once();
  }));
});
