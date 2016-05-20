describe('Backup Controller', function() {

  var walletService;

  describe('Incomplete wallet', function() {
    beforeEach(function(done) {
      mocks.init(FIXTURES, 'backupController', {
        loadProfile: PROFILE.incomplete2of2,
      }, done);
    });

    afterEach(function(done) {
      mocks.clear({}, done);
    });

    it('should be defined', function() {
      should.exist(ctrl);
    });
    it('should set the mnemonic incomplete wallets', function(done) {
      should.exist(ctrl);
      ctrl.mnemonicWords.should.deep.equal('dizzy cycle skirt decrease exotic fork sure mixture hair vapor copper hero'.split(' '));
      done();
    });
  });

  describe('Complete 1-1 wallet', function() {
    beforeEach(function(done) {
      mocks.init(FIXTURES, 'backupController', {
        loadProfile: PROFILE.testnet1of1,
      }, done);
    });

    afterEach(function(done) {
      mocks.clear({}, done);
    });

    it('should not set the mnemonic for complete wallets', function() {
      ctrl.mnemonicWords.should.deep.equal('cheese where alarm job conduct donkey license pave congress pepper fence current'.split(' '));
    });

    it('should set main wallet info', function(done) {
      ctrl.walletName.should.equal('kk');
      done();
    });
  });
});
