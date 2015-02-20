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

describe("Unit: Controllers", function() {
  config.plugins.LocalStorage = true;
  config.plugins.GoogleDrive = null;
  config.plugins.InsightStorage = null;
  config.plugins.EncryptedInsightStorage = null;

  var anAddr = 'mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy';
  var anAmount = 1000;
  var aComment = 'hola';



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
    $rootScope.safeUnspentCount = 1;

    //
    // TODO Use the REAL wallet, and stub only networking and DB components!
    //

    var w = {};
    w.id = 1234;
    w.isComplete = sinon.stub().returns(true);
    w.isShared = sinon.stub().returns(true);
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

    w.spend = sinon.stub().yields(null);
    w.sendTxProposal = sinon.stub();
    w.broadcastTx = sinon.stub().yields(null);
    w.requiresMultipleSignatures = sinon.stub().returns(true);
    w.getTxProposals = sinon.stub().returns([1, 2, 3]);
    w.getPendingTxProposals = sinon.stub().returns(
      [{
        isPending: true
      }]
    );
    w.getId = sinon.stub().returns(1234);
    w.on = sinon.stub().yields({
      'e': 'errmsg',
      'loading': false
    });
    w.sizes = sinon.stub().returns({
      tota: 1234
    });
    w.getBalance = sinon.stub().returns(10000);
    w.publicKeyRing = sinon.stub().yields(null);
    w.publicKeyRing.nicknameForCopayer = sinon.stub().returns('nickcopayer');
    w.updateFocusedTimestamp = sinon.stub().returns(1415804323);
    w.getAddressesInfo = sinon.stub().returns([{
      addressStr: "2MxvwvfshZxw4SkkaJZ8NDKLyepa9HLMKtu",
      isChange: false
    }]);


    var iden = {};
    iden.getLastFocusedWallet = sinon.stub().returns(null);
    iden.getWallets = sinon.stub().returns([w]);
    iden.getWalletById = sinon.stub().returns(w);
    iden.getName = sinon.stub().returns('name');
    iden.deleteWallet = sinon.stub();
    iden.close = sinon.stub().returns(null);


    $rootScope.wallet = w;
    $rootScope.iden = iden;
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


  describe('Create Profile Controller', function() {
    var c, confService, idenService;
    beforeEach(inject(function($controller, $rootScope, configService, identityService) {
      scope = $rootScope.$new();
      confService = configService;
      idenService = identityService;
      c = $controller('CreateProfileController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(c);
    });

    it('#init', function() {
      scope.init();
    });

    it('#clear', function() {
      scope.clear();
    });

    it('#saveSettings', function() {
      var old = confService.set;
      confService.set = sinon.stub().returns(null);
      scope.saveSettings();
      confService.set.calledOnce.should.be.true;
      confService.set = old;
    });

    it('#createProfile', function() {
      var old = scope.saveSettings;
      scope.saveSettings = sinon.stub().returns(null);
      scope.createProfile();
      scope.saveSettings.calledOnce.should.be.true;
      scope.saveSettings = old;
    });

    it('#_doCreateProfile', function() {
      var old = idenService.create;
      idenService.create = sinon.stub().returns(null);
      scope._doCreateProfile('myemail@domain.com', 'password');
      idenService.create.calledOnce.should.be.true;
      idenService.create = old;
    });

    it('#createDefaultWallet', function() {
      var old = idenService.createDefaultWallet;
      idenService.createDefaultWallet = sinon.stub().returns(null);
      scope.createDefaultWallet();
      idenService.createDefaultWallet.calledOnce.should.be.true;
      idenService.createDefaultWallet = old;
    });



  });

  describe('Receive Controller', function() {
    var c;
    var rootScope;
    beforeEach(inject(function($controller, $rootScope) {
      rootScope = $rootScope;
      scope = $rootScope.$new();
      c = $controller('ReceiveController', {
        $scope: scope,
      });


      var createW = function(N, conf) {

        var c = JSON.parse(JSON.stringify(conf || walletConfig));
        if (!N) N = c.totalCopayers;

        var mainPrivateKey = new copay.PrivateKey({
          networkName: walletConfig.networkName
        });
        var mainCopayerEPK = mainPrivateKey.deriveBIP45Branch().extendedPublicKeyString();
        c.privateKey = mainPrivateKey;

        c.publicKeyRing = new copay.PublicKeyRing({
          networkName: c.networkName,
          requiredCopayers: Math.min(N, c.requiredCopayers),
          totalCopayers: N,
        });
        c.publicKeyRing.addCopayer(mainCopayerEPK);

        c.publicKeyRing.getAddressesOrdered = sinon.stub().returns(null);

        c.txProposals = new copay.TxProposals({
          networkName: c.networkName,
        });

        c.blockchain = new Blockchain(walletConfig.blockchain);

        c.network = sinon.stub();
        c.network.setHexNonce = sinon.stub();
        c.network.setHexNonces = sinon.stub();
        c.network.getHexNonce = sinon.stub();
        c.network.getHexNonces = sinon.stub();
        c.network.peerFromCopayer = sinon.stub().returns('xxxx');
        c.network.send = sinon.stub();

        c.addressBook = {
          '2NFR2kzH9NUdp8vsXTB4wWQtTtzhpKxsyoJ': {
            label: 'John',
            copayerId: '026a55261b7c898fff760ebe14fd22a71892295f3b49e0ca66727bc0a0d7f94d03',
            createdTs: 1403102115,
            hidden: false
          },
          '2MtP8WyiwG7ZdVWM96CVsk2M1N8zyfiVQsY': {
            label: 'Jennifer',
            copayerId: '032991f836543a492bd6d0bb112552bfc7c5f3b7d5388fcbcbf2fbb893b44770d7',
            createdTs: 1403103115,
            hidden: false
          }
        };

        c.networkName = walletConfig.networkName;
        c.version = '0.0.1';

        c.generateAddress = sinon.stub().returns({});

        c.balanceInfo = {};

        return new Wallet(c);
      };

      $rootScope.wallet = createW();
      $rootScope.wallet.balanceInfo = {};
    }));

    it('should exist', function() {
      should.exist(c);
    });

    it('#init', function() {
      scope.init();
      rootScope.title.should.be.equal('Receive');
    });

    it('should call setAddressList', function() {
      scope.setAddressList();
      expect(scope.addresses).to.be.empty;
      scope.toggleShowAll();
      scope.setAddressList();
      expect(scope.addresses).to.be.empty;
    });

    it('#newAddr', function() {
      rootScope.wallet.generateAddress = sinon.stub().returns({});
      scope.newAddr();
      rootScope.wallet.generateAddress.calledOnce.should.be.true;
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



  describe('Profile Controller', function() {
    var ctrl, bkpService, idenService;
    beforeEach(inject(function($controller, $rootScope, backupService, identityService) {
      scope = $rootScope.$new();
      bkpService = backupService;
      idenService = identityService;
      ctrl = $controller('ProfileController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });

    it('#downloadProfileBackup', function() {
      var old = bkpService.profileDownload;
      bkpService.profileDownload = sinon.stub().returns(null);
      scope.downloadProfileBackup();
      bkpService.profileDownload.calledOnce.should.be.true;
      bkpService.profileDownload = old;
    });

    it('#viewProfileBackup', function() {
      var old = bkpService.profileEncrypted;
      bkpService.profileEncrypted = sinon.stub().returns(null);
      scope.viewProfileBackup();
      //bkpService.profileEncrypted.calledOnce.should.be.true;
      bkpService.profileEncrypted = old;
    });

    it('#copyProfileBackup', function() {
      var old = bkpService.profileEncrypted;
      bkpService.profileEncrypted = sinon.stub().returns(null);

      window.cordova = {
        plugins: {
          clipboard: {
            copy: function(e) {
              return e;
            }
          }
        }
      };

      window.plugins = {
        toast: {
          showShortCenter: function(e) {
            return e;
          }
        }
      };

      scope.copyProfileBackup();
      bkpService.profileEncrypted.calledOnce.should.be.true;
      bkpService.profileEncrypted = old;
    });

    it('#sendProfileBackup', function() {
      var old = bkpService.profileEncrypted;
      bkpService.profileEncrypted = sinon.stub().returns(null);

      window.plugin = {
        email: {
          open: function(e) {
            return e;
          }
        }
      };

      window.plugins = {
        toast: {
          showShortCenter: function(e) {
            return e;
          }
        }
      };

      scope.sendProfileBackup();
      bkpService.profileEncrypted.calledOnce.should.be.true;
      bkpService.profileEncrypted = old;
    });

    it('#deleteProfile', function() {
      var old = idenService.deleteProfile;
      idenService.deleteProfile = sinon.stub().returns(null);
      scope.deleteProfile();
      idenService.deleteProfile.calledOnce.should.be.true;
      idenService.deleteProfile = old;
    });


  });



  describe('Send Controller', function() {
    var scope, form, sendForm, sendCtrl, rootScope;
    beforeEach(angular.mock.inject(function($compile, $rootScope, $controller, rateService, notification) {
      scope = $rootScope.$new();
      rootScope = $rootScope;
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
        _address: null,
        _amount: null
      };
      $compile(element)(scope);

      var element2 = angular.element(
        '<form name="form2">' +
        '<input type="text" id="address" name="address" ng-model="_address" valid-address required>' +
        '<input type="number" id="amount" name="amount" ng-model="_amount" min="0.00000001" max="10000000000" valid-amount required>' +
        '<input type="number" id="alternative" name="alternative" ng-model="_alternative">' +
        '<textarea id="comment" name="comment" ng-model="commentText" ng-maxlength="100"></textarea>' +
        '</form>'
      );
      $compile(element2)(scope);
      sendCtrl = $controller('SendController', {
        $scope: scope,
        $modal: {},
      });
      scope.init();
      scope.$digest();
      form = scope.form;
      sendForm = scope.form2;
      scope.sendForm = sendForm;
    }));

    it('should have a SendController controller', function() {
      should.exist(scope.submitForm);
    });

    it('should have a title', function() {
      expect(scope.title);
    });

    it('#setError', function() {
      scope.setError('my error');
      expect(scope.error);
    });

    it('#setFromPayPro', function() {
      var old = rootScope.wallet.fetchPaymentRequest
      rootScope.wallet.fetchPaymentRequest = sinon.stub().returns(null);
      scope.setFromPayPro('newURL');
      rootScope.wallet.fetchPaymentRequest.calledOnce.should.be.true;
      rootScope.wallet.fetchPaymentRequest = old;
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

    it('should create a transaction proposal with given values', inject(function($timeout) {
      sendForm.address.$setViewValue(anAddr);
      sendForm.amount.$setViewValue(anAmount);
      sendForm.comment.$setViewValue(aComment);

      var w = scope.wallet;
      scope.submitForm(sendForm);

      $timeout.flush();
      sinon.assert.callCount(w.spend, 1);
      sinon.assert.callCount(w.broadcastTx, 0);
      var spendArgs = w.spend.getCall(0).args[0];
      spendArgs.toAddress.should.equal(anAddr);
      spendArgs.amountSat.should.equal(anAmount * scope.wallet.settings.unitToSatoshi);
      spendArgs.comment.should.equal(aComment);
    }));


    it('should handle big values in 100 BTC', inject(function($timeout) {
      var old = scope.wallet.settings.unitToSatoshi;
      scope.wallet.settings.unitToSatoshi = 100000000;
      sendForm.address.$setViewValue(anAddr);
      sendForm.amount.$setViewValue(100);
      sendForm.address.$setViewValue(anAddr);

      scope.updateTxs = sinon.spy();
      scope.submitForm(sendForm);
      var w = scope.wallet;
      $timeout.flush();
      w.spend.getCall(0).args[0].amountSat.should.equal(100 * scope.wallet.settings.unitToSatoshi);
      scope.wallet.settings.unitToSatoshi = old;
    }));


    it('should handle big values in 5000 BTC', inject(function($rootScope, $timeout) {
      var w = scope.wallet;
      w.requiresMultipleSignatures = sinon.stub().returns(true);


      var old = $rootScope.wallet.settings.unitToSatoshi;
      $rootScope.wallet.settings.unitToSatoshi = 100000000;
      sendForm.address.$setViewValue(anAddr);
      sendForm.amount.$setViewValue(5000);
      scope.submitForm(sendForm);
      $timeout.flush();

      w.spend.getCall(0).args[0].amountSat.should.equal(5000 * $rootScope.wallet.settings.unitToSatoshi);
      $rootScope.wallet.settings.unitToSatoshi = old;
    }));

    it('should convert bits amount to fiat', function(done) {
      scope.rateService.whenAvailable(function() {
        sendForm.amount.$setViewValue(1e6);
        scope.$digest();
        expect(scope._amount).to.equal(1e6);
        expect(scope.__alternative).to.equal(2);
        done();
      });
    });
    it('should convert fiat to bits amount', function(done) {
      scope.rateService.whenAvailable(function() {
        sendForm.alternative.$setViewValue(2);
        scope.$digest();
        expect(scope.__alternative).to.equal(2);
        expect(scope._amount).to.equal(1e6);
        done();
      });
    });

    it('receive from uri using bits', inject(function() {
      sendForm.address.$setViewValue('bitcoin:mxf5psDyA8EQVzb2MZ7MkDWiXuAuWWCRMB?amount=1.018085');
      expect(sendForm.amount.$modelValue).to.equal(1018085);
      sendForm.address.$setViewValue('bitcoin:mxf5psDyA8EQVzb2MZ7MkDWiXuAuWWCRMB?amount=1.01808500');
      expect(sendForm.amount.$modelValue).to.equal(1018085);
      sendForm.address.$setViewValue('bitcoin:mxf5psDyA8EQVzb2MZ7MkDWiXuAuWWCRMB?amount=0.29133585');
      expect(sendForm.amount.$modelValue).to.equal(291335.85);
    }));

    it('receive from uri using BTC', inject(function($rootScope) {
      var old = $rootScope.wallet.settings.unitToSatoshi;
      var old_decimals = $rootScope.wallet.settings.unitDecimals;
      $rootScope.wallet.settings.unitToSatoshi = 100000000;
      $rootScope.wallet.settings.unitDecimals = 8;
      sendForm.address.$setViewValue('bitcoin:mxf5psDyA8EQVzb2MZ7MkDWiXuAuWWCRMB?amount=1.018085');
      expect(sendForm.amount.$modelValue).to.equal(1.018085);
      sendForm.address.$setViewValue('bitcoin:mxf5psDyA8EQVzb2MZ7MkDWiXuAuWWCRMB?amount=1.01808500');
      expect(sendForm.amount.$modelValue).to.equal(1.018085);
      sendForm.address.$setViewValue('bitcoin:mxf5psDyA8EQVzb2MZ7MkDWiXuAuWWCRMB?amount=0.29133585');
      expect(sendForm.amount.$modelValue).to.equal(0.29133585);
      sendForm.address.$setViewValue('bitcoin:mxf5psDyA8EQVzb2MZ7MkDWiXuAuWWCRMB?amount=0.1');
      expect(sendForm.amount.$modelValue).to.equal(0.1);
      $rootScope.wallet.settings.unitToSatoshi = old;
      $rootScope.wallet.settings.unitDecimals = old_decimals;
    }));
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

  describe("Unit: Sidebar Controller", function() {
    beforeEach(inject(function($controller, $rootScope) {
      rootScope = $rootScope;
      scope = $rootScope.$new();
      headerCtrl = $controller('SidebarController', {
        $scope: scope,
      });
    }));

    it('should call sign out', function() {
      scope.signout();
      rootScope.iden.close.calledOnce.should.be.true;
    });
  });

  describe("Head Controller", function() {
    var scope, ctrl, rootScope, idenService, balService;
    beforeEach(inject(function($controller, $rootScope, identityService, balanceService) {
      rootScope = $rootScope;
      idenService = identityService;
      balService = balanceService;
      scope = $rootScope.$new();
      ctrl = $controller('HeadController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });

    it('should call sign out', function() {
      var old = idenService.signout;
      idenService.signout = sinon.stub().returns(null);
      scope.signout();
      idenService.signout.calledOnce.should.be.true;
      idenService.signout = old;
    });

    it('should call refresh', function() {
      var old = rootScope.wallet.sendWalletReady;
      rootScope.wallet.sendWalletReady = sinon.stub().returns(null);
      balService.clearBalanceCache = sinon.stub().returns(null);
      scope.refresh();
      rootScope.wallet.sendWalletReady.calledOnce.should.be.true;
      rootScope.wallet.sendWalletReady = old;
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
      scope.setTopAmount(form);
      form.amount.$setViewValue(123356);
      expect(scope.amount).to.equal(123356);
      expect(form.amount.$invalid).to.equal(false);
      expect(form.amount.$pristine).to.equal(false);
    });
  });

  describe('Import Controller', function() {
    var ctrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      ctrl = $controller('ImportController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });
    it('import status', function() {
      expect(scope.importStatus).equal('Importing wallet - Reading backup...');
    });
  });

  // TODO: fix this test
  describe.skip('Home Controller', function() {
    var ctrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      ctrl = $controller('HomeController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });
    describe('#open', function() {
      it('should work with invalid form', function() {
        scope.open(invalidForm);
      });
    });
  });

  describe('SignOut Controller', function() {
    var ctrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      ctrl = $controller('signOutController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
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
    var ctrl, rootScope, idenService;
    beforeEach(inject(function($controller, $rootScope, identityService) {
      scope = $rootScope.$new();
      rootScope = $rootScope;
      idenService = identityService;
      ctrl = $controller('CopayersController', {
        $scope: scope,
        $modal: {},
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });

    it('#init', function() {
      var old = scope.updateList;
      scope.updateList = sinon.stub().returns(null);
      scope.init();
      scope.updateList.callCount.should.be.equal(3); //why 3 ??????
      scope.updateList = old;
    });

    it('#updateList', function() {
      var old = rootScope.wallet.getRegisteredPeerIds;
      rootScope.wallet.getRegisteredPeerIds = sinon.stub().returns(null);
      rootScope.wallet.removeListener = sinon.stub().returns(null);
      scope.updateList();
      rootScope.wallet.getRegisteredPeerIds.callCount.should.be.equal(1);
      rootScope.wallet.getRegisteredPeerIds = old;
    });

    it('#deleteWallet', inject(function($timeout) {
      var old = idenService.deleteWallet;
      idenService.deleteWallet = sinon.stub().returns(null);
      scope.deleteWallet();
      $timeout.flush();
      idenService.deleteWallet.callCount.should.be.equal(1);
      idenService.deleteWallet = old;
    }));

  });

  describe('Join Controller', function() {
    var ctrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      ctrl = $controller('JoinController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });
    describe('#join', function() {
      it('should work with invalid form', function() {
        scope.join(invalidForm);
      });
    });
  });

  describe('paymentUriController Controller', function() {
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
      what = $controller('paymentUriController', {
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
      scope.pendingPayment.should.equal('bitcoin:19mP9FKrXqL46Si58pHdhGKow88SUPy1V8?amount=0.1&message=a bitcoin donation');
    });
  });

  describe('Warning Controller', function() {
    var ctrl, idenService;
    beforeEach(inject(function($controller, $rootScope, identityService) {
      scope = $rootScope.$new();
      idenService = identityService;
      ctrl = $controller('WarningController', {
        $scope: scope,
      });
    }));

    it('should exist', function() {
      should.exist(ctrl);
    });

    it('#signout', function() {
      var old = idenService.signout;
      idenService.signout = sinon.stub().returns(null);
      scope.signout();
      idenService.signout.calledOnce.should.be.true;
      idenService.signout = old;
    });

  });

  describe('More Controller', function() {
    var ctrl, modalCtrl, rootScope, idenService, bkpService;
    beforeEach(inject(function($controller, $rootScope, backupService, identityService) {
      scope = $rootScope.$new();
      rootScope = $rootScope;
      idenService = identityService;
      bkpService = backupService;
      ctrl = $controller('MoreController', {
        $scope: scope
      });
      saveAsLastCall = null;

    }));

    it('Backup Wallet controller #download', function() {
      var w = scope.wallet;
      expect(saveAsLastCall).equal(null);
      scope.downloadWalletBackup();

      expect(saveAsLastCall.blob.size).equal(7);
      expect(saveAsLastCall.blob.type).equal('text/plain;charset=utf-8');
    });

    it('Backup Wallet controller should name backup correctly for multiple copayers', function() {
      var w = scope.wallet;
      expect(saveAsLastCall).equal(null);
      scope.downloadWalletBackup();
      expect(saveAsLastCall.filename).equal('nickname-fakeWallet-keybackup.json.aes');
    });

    it('Backup Wallet controller should name backup correctly for 1-1 wallet', function() {
      var w = scope.wallet;
      expect(saveAsLastCall).equal(null);
      scope.wallet.totalCopayers = 1;
      scope.downloadWalletBackup();
      expect(saveAsLastCall.filename).equal('fakeWallet-keybackup.json.aes');
    });

    it('Delete a wallet', inject(function($timeout) {
      var w = scope.wallet;

      scope.deleteWallet();
      $timeout.flush();
      scope.$digest();
      scope.iden.deleteWallet.calledOnce.should.equal(true);
      scope.iden.deleteWallet.getCall(0).args[0].should.equal(w.getId());
    }));

    it('#save', function() {
      var old = rootScope.wallet.changeSettings;
      rootScope.wallet.changeSettings = sinon.stub().returns(null);
      scope.selectedUnit = {};
      scope.save();
      rootScope.wallet.changeSettings.calledOnce.should.equal.true;
      rootScope.wallet.changeSettings = old;
    });

    it('#purge checking balance', function() {
      var old = rootScope.wallet.purgeTxProposals;
      rootScope.wallet.purgeTxProposals = sinon.stub().returns(true);
      scope.purge();
      rootScope.wallet.purgeTxProposals.calledOnce.should.equal.true;
      rootScope.wallet.purgeTxProposals = old;
    });

    it('#purge without checking balance', function() {
      var old = rootScope.wallet.purgeTxProposals;
      rootScope.wallet.purgeTxProposals = sinon.stub().returns(false);
      scope.purge();
      rootScope.wallet.purgeTxProposals.calledOnce.should.equal.true;
      rootScope.wallet.purgeTxProposals = old;
    });

    it('#updateIndexes', function() {
      var old = rootScope.wallet.purgeTxProposals;
      rootScope.wallet.updateIndexes = sinon.stub().yields();
      scope.updateIndexes();
      rootScope.wallet.updateIndexes.calledOnce.should.equal.true;
      rootScope.wallet.updateIndexes = old;
    });

    it('#updateIndexes return error', function() {
      var old = rootScope.wallet.purgeTxProposals;
      rootScope.wallet.updateIndexes = sinon.stub().yields('error');
      scope.updateIndexes();
      rootScope.wallet.updateIndexes.calledOnce.should.equal.true;
      rootScope.wallet.updateIndexes = old;
    });

    it('#deleteWallet', inject(function($timeout) {
      var old = idenService.deleteWallet;
      idenService.deleteWallet = sinon.stub().yields(null);
      scope.deleteWallet();
      $timeout.flush();
      idenService.deleteWallet.calledOnce.should.equal.true;
      scope.loading.should.be.false;
      idenService.deleteWallet = old;
    }));

    it('#deleteWallet with error', inject(function($timeout) {
      var old = idenService.deleteWallet;
      idenService.deleteWallet = sinon.stub().yields('error');
      scope.deleteWallet();
      $timeout.flush();
      idenService.deleteWallet.calledOnce.should.equal.true;
      scope.error.should.be.equal('error');
      idenService.deleteWallet = old;
    }));

    it('#viewWalletBackup', function() {
      var old = bkpService.walletEncrypted;
      bkpService.walletEncrypted = sinon.stub().returns('backup0001');
      scope.viewWalletBackup();
      bkpService.walletEncrypted.calledOnce.should.equal.true;
      bkpService.walletEncrypted = old;
    });

    it('#copyWalletBackup', function() {
      var old = bkpService.walletEncrypted;
      bkpService.walletEncrypted = sinon.stub().returns('backup0001');
      window.cordova = {
        plugins: {
          clipboard: {
            copy: function(e) {
              return e;
            }
          }
        }
      };

      window.plugins = {
        toast: {
          showShortCenter: function(e) {
            return e;
          }
        }
      };
      scope.copyWalletBackup();
      bkpService.walletEncrypted.calledOnce.should.equal.true;
      bkpService.walletEncrypted = old;
    });

    it('#sendWalletBackup', function() {
      var old = bkpService.walletEncrypted;
      bkpService.walletEncrypted = sinon.stub().returns('backup0001');

      window.plugins = {
        toast: {
          showShortCenter: function(e) {
            return e;
          }
        }
      };

      window.plugin = {
        email: {
          open: function(e) {
            return e;
          }
        }
      };
      scope.sendWalletBackup();
      bkpService.walletEncrypted.calledOnce.should.equal.true;
      bkpService.walletEncrypted = old;
    });

  });

});
