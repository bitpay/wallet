//
// test/unit/services/servicesSpec.js
//
describe("Unit: Testing Services", function() {

  beforeEach(angular.mock.module('copayApp.services'));

  it('should contain a Socket service', inject(function(Socket) {
    expect(Socket).not.to.equal(null);
  }));


  it('Socket should support #on', inject(function(Socket) {
    expect(Socket.on).to.be.a('function');
  }));


  it('Socket should support #sysOn', inject(function(Socket) {
    expect(Socket.sysOn).to.be.a('function');
  }))


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



  it('should contain a walletFactory service', inject(function(walletFactory) {
    expect(walletFactory).not.to.equal(null);
  }));


  // TODO
  /*beforeEach(angular.mock.module('copayApp.controllerUtils'));

  it('should contain a controllerUtils service', inject(function(controllerUtils) {
    expect(controllerUtils).not.to.equal(null);
  }));
*/
});
