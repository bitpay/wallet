
describe('walletService', function () {

  var walletService;
  beforeEach(module('copayApp.services'));

  // The module needs to be included in the test.
  beforeEach(module('copayApp'));
  


  beforeEach(inject(function (_walletService_) {
    walletService = _walletService_;
  }));

  describe('walletService', function () {

    it('should be defined', function () {
      should.exists(walletService);
    });

  });

});
