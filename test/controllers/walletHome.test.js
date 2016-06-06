describe('walletHome', function() {

  var walletService;
  var fixtures = {};


  beforeEach(function(done){
    mocks.init(fixtures, 'walletHomeController', {}, done);
  })

  afterEach(function(done){
    mocks.clear({}, done);
  });

  it('should be defined', function() {
    should.exist(ctrl);
  });

});
