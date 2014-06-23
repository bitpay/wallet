//
// test/unit/controllers/controllersSpec.js
//

// Replace saveAs plugin
saveAsLastCall = null;
saveAs = function(o) {
  saveAsLastCall = o;
};


describe("Unit: Controllers", function() {

  var scope;

  beforeEach(module('copayApp.services'));
  beforeEach(module('copayApp.controllers'));

  var config = {
    requiredCopayers: 3,
    totalCopayers: 5,
    spendUnconfirmed: 1,
    reconnectDelay: 100,
    networkName: 'testnet' 
  };

  describe('Backup Controller', function() {
    var ctrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();

      $rootScope.wallet = new FakeWallet(config);
      ctrl = $controller('BackupController', {
        $scope: scope,
        $modal: {},
      });
    }));

    it('Should have a Backup controller', function() {
      expect(scope.title).equal('Backup');
    });

    it('Backup controller #download', function() {
      scope.wallet.setEnc('1234567');
      expect(saveAsLastCall).equal(null);
      scope.download();
      expect(saveAsLastCall.size).equal(7);
      expect(saveAsLastCall.type).equal('text/plain;charset=utf-8');
    });

    it('Backup controller #delete', function() {
      expect(scope.wallet).not.equal(undefined);
      scope.deleteWallet();
      expect(scope.wallet).equal(undefined);
    });
  });

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
    var transactionsCtrl;
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

  describe('Send Controller', function() {
    var scope, form;
    beforeEach(angular.mock.module('copayApp'));
    beforeEach(angular.mock.inject(function($compile, $rootScope, $controller){
      scope = $rootScope.$new();
      $rootScope.wallet = new FakeWallet(config);
      var element = angular.element(
        '<form name="form">' +
        '<input type="text" id="newaddress" name="newaddress" ng-disabled="loading" placeholder="Address" ng-model="newaddress" valid-address required>' +
        '<input type="text" id="newlabel" name="newlabel" ng-disabled="loading" placeholder="Label" ng-model="newlabel" required>' +
        '</form>'
      );
      scope.model = {
        newaddress: null,
        newlabel: null,
      };
      $compile(element)(scope);
      $controller('SendController', {$scope: scope,
        $modal: {},
      });
      scope.$digest();
      form = scope.form;
    }));

    it('should have a SendController controller', function() {
      expect(scope.loading).equal(false);
    });

    it('should have a title', function() {
      expect(scope.title).equal('Send');
    });

    it('should return true if wallet has addressBook', function() {
      expect(scope.showAddressBook()).equal(true);
    });

    it('should validate address', function() {
      form.newaddress.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      expect(form.newaddress.$invalid).to.equal(false);
    });

    it('should not validate address', function() {
      form.newaddress.$setViewValue('thisisaninvalidaddress');
      expect(form.newaddress.$invalid).to.equal(true);
    });

    it('should validate label', function() {
      form.newlabel.$setViewValue('John');
      expect(form.newlabel.$invalid).to.equal(false);
    });

    it('should not validate label', function() {
      expect(form.newlabel.$invalid).to.equal(true);
    });

  });

  describe("Unit: Header Controller", function() {
    var scope, $httpBackendOut;
    var GH = 'https://api.github.com/repos/bitpay/copay/tags';
    beforeEach(inject(function($controller, $injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.when('GET', GH)
        .respond([{
          name: "v100.1.6",
          zipball_url: "https://api.github.com/repos/bitpay/copay/zipball/v0.0.6",
          tarball_url: "https://api.github.com/repos/bitpay/copay/tarball/v0.0.6",
          commit: {
            sha: "ead7352bf2eca705de58d8b2f46650691f2bc2c7",
            url: "https://api.github.com/repos/bitpay/copay/commits/ead7352bf2eca705de58d8b2f46650691f2bc2c7"
          }
        }]);
    }));

    var rootScope;
    beforeEach(inject(function($controller, $rootScope) {
      rootScope = $rootScope;
      scope = $rootScope.$new();
      headerCtrl = $controller('HeaderController', {
        $scope: scope,
      });
    }));


    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have a txAlertCount', function() {
      expect(scope.txAlertCount).equal(0);
      $httpBackend.flush();
    });

    it('should hit github for version', function() {
      $httpBackend.expectGET(GH);
      scope.$apply();
      $httpBackend.flush();
    });

    it('should check version ', function() {
      $httpBackend.expectGET(GH);
      scope.$apply();
      $httpBackend.flush();
      expect(scope.updateVersion.class).equal('error');
      expect(scope.updateVersion.version).equal('v100.1.6');
    });

    it('should check blockChainStatus', function() {
      $httpBackend.expectGET(GH);
      $httpBackend.flush();
      rootScope.insightError = 1;
      scope.$apply();
      expect(rootScope.insightError).equal(1);
      scope.$apply();
      expect(rootScope.insightError).equal(1);
      scope.$apply();
    });

  });

  describe('Send Controller', function() {
    var sendCtrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      sendCtrl = $controller('SendController', {
        $scope: scope,
        $modal: {},
      });
    }));

    it('should have a SendController', function() {
      expect(scope.isMobile).not.to.equal(null);
    });
  });

});
