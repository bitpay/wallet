describe('walletService', function() {

  var walletService;


  // Adds walletService's module dependencies
  beforeEach(function() {
    module('ngLodash');
    module('gettext');
    module('angularMoment');
    module('bwcModule');
    module('copayApp.services');
  });


  beforeEach(inject(function(_walletService_) {
    walletService = _walletService_;
  }));

  it('should be defined', function() {
    should.exist(walletService);
  });

});
