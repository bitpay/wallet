//
// test/unit/controllers/controllersSpec.js
//
describe("Unit: Testing Controllers", function() {

  beforeEach(angular.mock.module('copay'));

  it('should have a AddressesController controller', function() {
    expect(copay.AddressesController).not.to.equal(null);
  });

  it('should have a BackupController controller', function() {
    expect(copay.Backupcontroller).not.to.equal(null);
  });

  it('should have a HeaderController controller', function() {
    expect(copay.HeaderController).not.to.equal(null);
  });

  it('should have a SendController controller', function() {
    expect(copay.SendController).not.to.equal(null);
  });

  it('should have a SetupController controller', function() {
    expect(copay.SetupController).not.to.equal(null);
  });

  it('should have a SigninController controller', function() {
    expect(copay.SigninController).not.to.equal(null);
  });

  it('should have a TransactionsController controller', function() {
    expect(copay.TransactionsController).not.to.equal(null);
  });

});
