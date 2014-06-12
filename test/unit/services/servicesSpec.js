//
// test/unit/services/servicesSpec.js
//
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
    Socket.on('a', function (){});
    Socket.on('b', function (){});
    Socket.sysOn('c', function (){});
    var ret = Socket.getListeners();
    expect(ret.a).to.be.equal(1);
    expect(ret.b).to.be.equal(1);
    expect(Object.keys(ret)).to.have.length(2);
  }));

  it('Socket should support #removeAllListeners', inject(function(Socket) {
    Socket.on('a', function (){});
    Socket.on('b', function (){});
    Socket.sysOn('c', function (){});
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
  beforeEach(angular.mock.module('notifications'));

  it('should updateBalance in bits', inject(function(controllerUtils, $rootScope) {
    expect(controllerUtils.updateBalance).not.to.equal(null);
    scope = $rootScope.$new();

    $rootScope.wallet=new FakeWallet();
    var addr = '1CjPR7Z5ZSyWk6WtXvSFgkptmpoi4UM9BC';
    var a = {}; a[addr]=100;
    $rootScope.wallet.set(1000000,900000,a);

    controllerUtils.updateBalance(function() {
      expect($rootScope.totalBalance).to.be.equal(1000000);
      expect($rootScope.totalBalanceBTC).to.be.equal('1.000');
      expect($rootScope.availableBalance).to.be.equal(900000);
      expect($rootScope.availableBalanceBTC).to.be.equal('0.900');
      expect($rootScope.addrInfos).not.to.equal(null);
      expect($rootScope.addrInfos[0].address).to.equal(addr);
    });
  }));


});

