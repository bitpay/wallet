//
// test/unit/controllers/controllersSpec.js
//

var sinon = require('sinon');

// Replace saveAs plugin
saveAs = function(blob, filename) {
  saveAsLastCall = {
    blob: blob,
    filename: filename
  };
};

var startServer = require('../../mocks/FakePayProServer');

describe("Unit: Controllers", function() {
  config.plugins.LocalStorage = true;
  config.plugins.GoogleDrive = null;

  var invalidForm = {
    $invalid: true
  };

  var scope;
  var server;

  beforeEach(module('copayApp'));
  beforeEach(module('copayApp.controllers'));
  beforeEach(module(function($provide) {
    $provide.value('request', {
      'get': function(_, cb) {
        cb(null, null, [{
          name: 'USD Dollars',
          code: 'USD',
          rate: 2
        }]);
      }
    });
  }));

  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope.$new();
    $rootScope.iden = sinon.stub();
    $rootScope.safeUnspentCount = 1;
    $rootScope.pendingTxCount = 0;

    var w = {};
    w.isReady = sinon.stub().returns(true);
    w.privateKey = {};
    w.settings = {
      unitToSatoshi: 100,
      unitDecimals: 2,
      alternativeName: 'US Dollar',
      alternativeIsoCode: 'USD',
    };
    w.addressBook = {
      'juan': '1',
    };
    w.totalCopayers = 2;
    w.getMyCopayerNickname = sinon.stub().returns('nickname');
    w.getMyCopayerId = sinon.stub().returns('id');
    w.privateKey.toObj = sinon.stub().returns({
      wallet: 'mock'
    });
    w.getSecret = sinon.stub().returns('secret');
    w.getName = sinon.stub().returns('fakeWallet');
    w.exportEncrypted = sinon.stub().returns('1234567');
    w.getTransactionHistory = sinon.stub().yields(null);
    w.getNetworkName = sinon.stub().returns('testnet');

    w.createTx = sinon.stub().yields(null);
    w.sendTx = sinon.stub().yields(null);
    w.requiresMultipleSignatures = sinon.stub().returns(true);
    w.getTxProposals = sinon.stub().returns([1, 2, 3]);
    w.getPendingTxProposals = sinon.stub().returns({
      txs : [{ isPending : true }],
      pendingForUs: 1
    });

    $rootScope.wallet = w;
  }));

  describe('Create Controller', function() {
    var c;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      c = $controller('CreateController', {
        $scope: scope,
      });
    }));

    describe('#getNumber', function() {
      it('should return an array of n undefined elements', function() {
        var n = 5;
        var array = scope.getNumber(n);
        expect(array.length).equal(n);
      });
    });
    describe('#create', function() {
      it('should work with invalid form', function() {
        scope.create(invalidForm);
      });
    });

  });

  describe('Receive Controller', function() {
    var c;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      c = $controller('ReceiveController', {
        $scope: scope,
      });
    }));

    it('should have a ReceiveController controller', function() {
      expect(scope.loading).equal(false);
    });
  });

  describe('History Controller', function() {
    var ctrl;
    beforeEach(inject(function($controller, $rootScope) {

      scope = $rootScope.$new();
      scope.wallet = null;
      scope.getTransactions = sinon.stub();
      ctrl = $controller('HistoryController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });

    it('should have a HistoryController controller', function() {
      expect(scope.loading).equal(false);
    });

    // this tests has no sense: getTransaction is async
    it.skip('should return an empty array of tx from insight', function() {
      scope.getTransactions();
      expect(scope.blockchain_txs).to.be.empty;
    });
  });

  describe('Send Controller', function() {
    var scope, form, sendForm, sendCtrl;
    beforeEach(angular.mock.inject(function($compile, $rootScope, $controller, rateService, notification) {
      scope = $rootScope.$new();
      scope.rateService = rateService;
      var element = angular.element(
        '<form name="form">' +
        '<input type="text" id="newaddress" name="newaddress" ng-disabled="loading" placeholder="Address" ng-model="newaddress" valid-address required>' +
        '<input type="text" id="newlabel" name="newlabel" ng-disabled="loading" placeholder="Label" ng-model="newlabel" required>' +
        '</form>'
      );
      scope.model = {
        newaddress: null,
        newlabel: null,
        address: null,
        amount: null
      };
      $compile(element)(scope);

      var element2 = angular.element(
        '<form name="form2">' +
        '<input type="text" id="address" name="address" ng-model="address" valid-address required>' +
        '<input type="number" id="amount" name="amount" ng-model="amount" min="1" max="10000000000" required>' +
        '<input type="number" id="alternative" name="alternative" ng-model="alternative">' +
        '<textarea id="comment" name="comment" ng-model="commentText" ng-maxlength="100"></textarea>' +
        '</form>'
      );
      $compile(element2)(scope);
      sendCtrl = $controller('SendController', {
        $scope: scope,
        $modal: {},
      });

      scope.$digest();
      form = scope.form;
      sendForm = scope.form2;
      scope.sendForm = sendForm;
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

    it('should validate address with network', function() {
      form.newaddress.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      expect(form.newaddress.$invalid).to.equal(false);
    });

    it('should not validate address with other network', function() {
      form.newaddress.$setViewValue('1JqniWpWNA6Yvdivg3y9izLidETnurxRQm');
      expect(form.newaddress.$invalid).to.equal(true);
    });

    it('should not validate random address', function() {
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

    it('should create a transaction proposal with given values', function() {
      sendForm.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      sendForm.amount.$setViewValue(1000);

      scope.loadTxs = sinon.spy();

      var w = scope.wallet;
      scope.submitForm(sendForm);
      sinon.assert.callCount(w.createTx, 1);
      sinon.assert.callCount(w.sendTx, 0);
      sinon.assert.callCount(scope.loadTxs, 1);
      w.createTx.getCall(0).args[0].should.equal('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      w.createTx.getCall(0).args[1].should.equal(1000 * scope.wallet.settings.unitToSatoshi);
      (typeof w.createTx.getCall(0).args[2]).should.equal('undefined');
    });


    it('should handle big values in 100 BTC', function() {
      var old = scope.wallet.settings.unitToSatoshi;
      scope.wallet.settings.unitToSatoshi = 100000000;;
      sendForm.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      sendForm.amount.$setViewValue(100);
      scope.loadTxs = sinon.spy();
      scope.submitForm(sendForm);
      var w = scope.wallet;
      w.createTx.getCall(0).args[1].should.equal(100 * scope.wallet.settings.unitToSatoshi);
      scope.wallet.settings.unitToSatoshi = old;
    });


    it('should handle big values in 5000 BTC', inject(function($rootScope) {
      var w = scope.wallet;
      w.requiresMultipleSignatures = sinon.stub().returns(true);


      var old = $rootScope.wallet.settings.unitToSatoshi;
      $rootScope.wallet.settings.unitToSatoshi = 100000000;;
      sendForm.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      sendForm.amount.$setViewValue(5000);
      scope.submitForm(sendForm);

      w.createTx.getCall(0).args[1].should.equal(5000 * $rootScope.wallet.settings.unitToSatoshi);
      $rootScope.wallet.settings.unitToSatoshi = old;
    }));

    it('should convert bits amount to fiat', function(done) {
      scope.rateService.whenAvailable(function() {
        sendForm.amount.$setViewValue(1e6);
        scope.$digest();
        expect(scope.alternative).to.equal(2);
        done();
      });
    });
    it('should convert fiat to bits amount', function(done) {
      scope.rateService.whenAvailable(function() {
        sendForm.alternative.$setViewValue(2);
        scope.$digest();
        expect(scope.amount).to.equal(1e6);
        done();
      });
    });

    it('should create and send a transaction proposal', function() {
      sendForm.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      sendForm.amount.$setViewValue(1000);
      scope.loadTxs = sinon.spy();

      var w = scope.wallet;
      w.requiresMultipleSignatures = sinon.stub().returns(false);
      w.totalCopayers = w.requiredCopayers = 1;


      scope.submitForm(sendForm);
      sinon.assert.callCount(w.createTx, 1);
      sinon.assert.callCount(w.sendTx, 1);
      sinon.assert.callCount(scope.loadTxs, 1);
    });

    it('should not send txp when there is an error at creation', function() {
      sendForm.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      sendForm.amount.$setViewValue(1000);
      scope.wallet.totalCopayers = scope.wallet.requiredCopayers = 1;
      scope.loadTxs = sinon.spy();
      var w = scope.wallet;
      w.createTx.yields('error');
      w.isShared = sinon.stub().returns(false);


      scope.submitForm(sendForm);

      sinon.assert.callCount(w.createTx, 1);
      sinon.assert.callCount(w.sendTx, 0);
      sinon.assert.callCount(scope.loadTxs, 1);
    });
  });

  describe("Unit: Version Controller", function() {
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
      headerCtrl = $controller('VersionController', {
        $scope: scope,
      });
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });



    it('should hit github for version', function() {
      $httpBackend.expectGET(GH);
      scope.$apply();
      $httpBackend.flush();
    });

    it('should check version ', inject(function($injector) {
      notification = $injector.get('notification');
      var spy = sinon.spy(notification, 'version');
      $httpBackend.expectGET(GH);
      scope.$apply();
      $httpBackend.flush();
      spy.calledOnce.should.equal(true);
    }));

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

  describe.skip("Unit: Sidebar Controller", function() {
    beforeEach(inject(function($controller, $rootScope) {
      rootScope = $rootScope;
      scope = $rootScope.$new();
      headerCtrl = $controller('SidebarController', {
        $scope: scope,
      });
    }));

    it('should return an array of n undefined elements', function() {
      var n = 5;
      var array = scope.getNumber(n);
      expect(array.length).equal(n);
    });
  });

  describe('Send Controller', function() {
    var sendCtrl, form;
    beforeEach(inject(function($compile, $rootScope, $controller) {
      scope = $rootScope.$new();
      $rootScope.availableBalance = 123456;

      var element = angular.element(
        '<form name="form">' +
        '<input type="number" id="amount" name="amount" placeholder="Amount" ng-model="amount" min="0.0001" max="10000000" enough-amount required>' +
        '</form>'
      );
      scope.model = {
        amount: null
      };
      $compile(element)(scope);
      scope.$digest();
      form = scope.form;

      sendCtrl = $controller('SendController', {
        $scope: scope,
        $modal: {},
      });
    }));

    it('should have a SendController', function() {
      expect(scope.isMobile).not.to.equal(null);
    });
    it('should autotop balance correctly', function() {
      scope.topAmount(form);
      form.amount.$setViewValue(123356);
      expect(scope.amount).to.equal(123356);
      expect(form.amount.$invalid).to.equal(false);
      expect(form.amount.$pristine).to.equal(false);
    });
    it('should return available amount', function() {
      form.amount.$setViewValue(123356);
      var amount = scope.getAvailableAmount();
      expect(amount).to.equal(123356);
    });
    it('should return 0 if available amount below minimum fee', function() {
      inject(function($compile, $rootScope, $controller) {
        $rootScope.availableBalance = 1;
      });
      var amount = scope.getAvailableAmount();
      expect(amount).to.equal(0);
    });
  });

  describe('Import Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      what = $controller('ImportController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });
    it('import status', function() {
      expect(scope.importStatus).equal('Importing wallet - Reading backup...');
    });
  });

  // TODO: fix this test
  describe.skip('Home Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      what = $controller('HomeController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });
    describe('#open', function() {
      it('should work with invalid form', function() {
        scope.open(invalidForm);
      });
    });
  });

  describe('Settings Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      what = $controller('SettingsController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });
  });

  describe('Copayers Controller', function() {
    var saveDownload = null;
    var ctrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();

      ctrl = $controller('CopayersController', {
        $scope: scope,
        $modal: {},
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });

  });

  describe('Join Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      what = $controller('JoinController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });
    describe('#join', function() {
      it('should work with invalid form', function() {
        scope.join(invalidForm);
      });
    });
  });

  describe('UriPayment Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope, $location) {
      scope = $rootScope.$new();
      var routeParams = {
        data: 'bitcoin:19mP9FKrXqL46Si58pHdhGKow88SUPy1V8'
      };
      var query = {
        amount: 0.1,
        message: "a bitcoin donation"
      };
      what = $controller('UriPaymentController', {
        $scope: scope,
        $routeParams: routeParams,
        $location: {
          search: function() {
            return query;
          }
        }
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });

    it('should parse url correctly', function() {
      should.exist(what);
      should.exist(scope.pendingPayment);
      scope.pendingPayment.address.data.should.equal('19mP9FKrXqL46Si58pHdhGKow88SUPy1V8');
      scope.pendingPayment.data.amount.should.equal(0.1);
      scope.pendingPayment.data.message.should.equal('a bitcoin donation');
    });
  });

  describe('Warning Controller', function() {
    var what;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      what = $controller('WarningController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(what);
    });
  });

});
