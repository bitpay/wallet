describe('createController', function() {
  var walletService;
  var storeProfile;

  mocks.init();

  it('should be defined', function() {
    should.exist(create);
  });

  it.only('should create a 1-1 wallet from mnemonic', function(done) {
    var fakeForm = {};

    // FROM DATA
    scope.seedSource = {
      id: 'set'
    };
    scope.requiredCopayers = 1;
    scope.totalCopayers = 1
    scope.walletName = 'A test wallet';
    scope.isTestnet = false;
    scope.bwsurl = null;
    scope.privateKey = 'legal winner thank year wave sausage worth useful legal winner thank yellow';

    create.setSeedSource();
    create.create(fakeForm);

    should.not.exist(create.error);
    mocks.go.walletHome.calledOnce.should.equal(true);

    // check resulting profile
    storageService.getProfile(function(err, profile) {
      should.not.exist(err);
      var c = profile.credentials[0];
      c.network.should.equal('livenet');
      // from test vectors from https://dcpos.github.io/bip39/
      c.xPrivKey.should.equal('xprv9s21ZrQH143K2x4gnzRB1eZDq92Uuvy9CXbvgQGdvykXZ9mkkot6LBjzDpgaAfvzkuxJe9JKJXQ38VoPutxvACA5MsyoBs5UyQ4HZKGshGs');
      console.log('[create.test.js.53:profile:]', c); //TODO
      done();
    });
  });

});
