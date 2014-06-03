//
// test/unit/controllers/controllersSpec.js
//
describe("Unit: Testing Controllers", function() {

    beforeEach(module('notifications'));
    beforeEach(module('copayApp.services'));
    beforeEach(module('copayApp.controllers'));

    var scope, addressCtrl;
//
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

//
//   it('should have a BackupController controller', function() {
//     expect(copayApp.Backupcontroller).not.to.equal(null);
//   });
//
//   it('should have a HeaderController controller', function() {
//     expect(copayApp.HeaderController).not.to.equal(null);
//   });
//
//   it('should have a SendController controller', function() {
//     expect(copayApp.SendController).not.to.equal(null);
//   });
//
//   it('should have a SetupController controller', function() {
//     expect(copayApp.SetupController).not.to.equal(null);
//   });
//
//   it('should have a SigninController controller', function() {
//     expect(copayApp.SigninController).not.to.equal(null);
// console.log('[controllersSpec.js.30:copayApp:]',copayApp); //TODO
//   });
//
//   it('should have a TransactionsController controller', function() {
//     expect(copayApp.TransactionsController).not.to.equal(null);
//   });
//
//   beforeEach(angular.mock.module('copay.walletFactory'));
//   it('should display a link to create a new wallet if no wallets in localStorage', inject(function(walletFactory) {
//     expect(walletFactory.storage.getWalletIds()).to.be.empty;
//   }));
});
