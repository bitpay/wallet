//
// test/unit/controllers/controllersSpec.js
//
describe("Unit: Testing Controllers", function() {

  var scope;

  beforeEach(module('notifications'));
  beforeEach(module('copayApp.services'));
  beforeEach(module('copayApp.controllers'));

  describe('Address Controller', function() {
    var addressCtrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      addressCtrl = $controller('AddressesController', {
        $scope: scope,
      });
    }));

    it('should have a AddressesController controller', function() {
      expect(scope.loading).equal(false);
    });

    it('selectedAddr should modify scope', function() {
      expect(scope.selectedAddress).equal(undefined);
      scope.selectAddress('hola');
      expect(scope.selectedAddr).equal('hola');
    });

  });

  describe('Transactions Controller', function() {
    var transactionCtrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      transactionsCtrl = $controller('TransactionsController', {
        $scope: scope,
      });
    }));

    it('should have a TransactionController controller', function() {
      expect(scope.loading).equal(false);
    });

    it('should return an empty array of tx from insight', function() {
      scope.getTransactions();
      expect(scope.blockchain_txs).to.be.empty;
    });
  });
});
