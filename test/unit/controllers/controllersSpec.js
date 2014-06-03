//
// test/unit/controllers/controllersSpec.js
//
describe("Unit: Testing Controllers", function() {

//  beforeEach(module('copay'));
  beforeEach(module('copay.signin'));
  
   it('should have a AddressesController controller', function() {
console.log('[controllersSpec.js.10:copayApp:]',copayApp.controller); //TODO
     expect(copayApp.AddressesController).not.to.equal(null);
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
