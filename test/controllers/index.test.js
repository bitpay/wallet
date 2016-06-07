describe('index', function() {

  var walletService;


  describe('Incomplete wallet', function() {
    beforeEach(function(done) {
      mocks.init(FIXTURES, 'indexController', {
        loadProfile: PROFILE.incomplete2of2,
        initController: true,
      }, done);
    });

    afterEach(function(done) {
      mocks.clear({}, done);
    });

    it('should be defined', function() {
      should.exist(ctrl);
    });
    it('should set the invitation code for incomplete wallets', function(done) {
      should.exist(ctrl);

      ctrl.walletSecret.should.equal('GJ1A8mopdW7wPNWGVksqwQKz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXyL');
      // should redirect to copayers
      mocks.go.path.getCall(0).args[0].should.equal('copayers');
      done();
    });
  });

  describe('Complete 1-1 wallet', function() {
    beforeEach(function(done) {
      mocks.init(FIXTURES, 'indexController', {
        loadProfile: PROFILE.testnet1of1,
        initController: true,
      }, done);
    });

    afterEach(function(done) {
      mocks.clear({}, done);
    });

    it('should not set the invitation code for complete wallets', function() {
      // should redirect to copayers
      mocks.go.path.callCount.should.equal(0);
      should.not.exist(ctrl.walletSecret);
    });

    it('should set main wallet info', function(done) {
      ctrl.walletName.should.equal('kk');
      ctrl.totalBalanceSat.should.equal(1847686);
      done();
    });

    it('should set information for receive tab', function(done) {
      ctrl.tab.should.equal('walletHome');
      ctrl.setTab('receive');
      ctrl.tab.should.equal('receive');
      done();
    });


    it.skip('should updates remote preferences', function(done) {
      ctrl.updateRemotePreferences({}, function() {
        done();
      });
    });
  });


});
