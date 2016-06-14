describe('Preferences History Controller', function() {

  var walletService;

  var txHistory = '[{"txid":"bf31ecaa8e10ce57f9a889fc4c893b40ff57b016dd763957d942e21ed55fc62c","action":"received","amount":120000,"fees":4862,"time":1464969291,"confirmations":8,"outputs":[{"amount":120000,"address":"2N4HgtF9cJSzxhVkj5gbKxwJSKWBmnb9FNJ","message":null}],"note":{"body":"just a comment","editedBy":"31a8c3c0be9ffbb9f257c95f3fd2f73a59cf81e40199ba5918417270db8c4cdb","editedByName":"2-2","editedOn":1464969101},"message":null,"creatorName":"","hasUnconfirmedInputs":false,"amountStr":"1,200 bits","alternativeAmountStr":"0.68 USD","feeStr":"49 bits","safeConfirmed":"6+"}]';

  describe('Complete 1-1 wallet', function() {
    beforeEach(function(done) {
      mocks.init(FIXTURES, 'preferencesHistory', {
        loadProfile: PROFILE.testnet1of1,
        loadStorage: {
          'txsHistory-66d3afc9-7d76-4b25-850e-aa62fcc53a7d': txHistory,
        },
      }, done);
    });

    afterEach(function(done) {
      mocks.clear({}, done);
    });

    it('should be defined', function() {
      should.exist(ctrl);
    });

    it('should export csv', function(done) {
      scope.csvHistory(function(err) {
        should.not.exist(err);
        should.exist(scope.csvReady);
        scope.csvReady.should.equal(true);
        should.exist(scope.csvContent);
        JSON.stringify(scope.csvContent).should.equal('[{"Date":"2016-06-03T15:54:51.000Z","Destination":"","Description":"","Amount":"0.00120000","Currency":"BTC","Txid":"bf31ecaa8e10ce57f9a889fc4c893b40ff57b016dd763957d942e21ed55fc62c","Creator":"","Copayers":"","Comment":"just a comment"}]');
        done();
      });
    });
  });

});
