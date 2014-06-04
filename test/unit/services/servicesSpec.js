//
// test/unit/services/servicesSpec.js
//
describe("Unit: Testing Services", function() {

  beforeEach(angular.mock.module('copayApp.services'));

  it('should contain a Socket service', inject(function(Socket) {
    expect(Socket).not.to.equal(null);
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
