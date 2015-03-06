'use strict';
//
// test/unit/directives/directivesSpec.js
//
describe("Unit: Testing Directives", function() {

  var $scope, form;

  beforeEach(module('copayApp.directives'));
  beforeEach(inject(function($rootScope) {

    var w = {};
    w.isComplete = sinon.stub().returns(true);
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
    w.getTransactionHistory = sinon.stub().yields({});
    w.getNetworkName = sinon.stub().returns('testnet');

    w.createTx = sinon.stub().yields(null);
    w.sendTx = sinon.stub().yields(null);
    w.requiresMultipleSignatures = sinon.stub().returns(true);
    w.getTxProposals = sinon.stub().returns([1,2,3]);
    $rootScope.wallet = w;
  }));

  describe('Validate Address', function() {
    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope;
      var element = angular.element(
        '<form name="form">' +
        '<input type="text" id="address" name="address" placeholder="Send to" ng-model="address" valid-address required>' +
        '</form>'
      );
      $scope.model = {
        address: null
      };
      $compile(element)($scope);
      $scope.$digest();
      form = $scope.form;
    }));

    it('should validate with network', inject(function($rootScope) {
      $rootScope.wallet.getNetworkName = sinon.stub().returns('testnet');
      form.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      expect(form.address.$invalid).to.equal(false);
    }));
    it('should not validate with other network', inject(function($rootScope) {
      $rootScope.wallet.getNetworkName = sinon.stub().returns('livenet');
      form.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      expect(form.address.$invalid).to.equal(true);
    }));
    it('should not validate random', function() {
      form.address.$setViewValue('thisisaninvalidaddress');
      expect(form.address.$invalid).to.equal(true);
    });
  });

  describe('Validate Amount', function() {
    describe('Unit: bits', function() {
      beforeEach(inject(function($compile, $rootScope) {
        $scope = $rootScope;
        var element = angular.element(
          '<form name="form">' +
          '<input type="number" id="amount" name="amount" placeholder="Amount" ng-model="amount" min="0.00000001" max="10000000000" valid-amount required>' +
          '</form>'
        );
        $scope.model = {
          amount: null
        };
        $compile(element)($scope);
        $scope.$digest();
        form = $scope.form;
      }));
      it('should validate', function() {
        form.amount.$setViewValue(100);
        expect(form.amount.$invalid).to.equal(false);
        form.amount.$setViewValue(800);
        expect(form.amount.$invalid).to.equal(false);
        form.amount.$setViewValue(900);

      });

      it('should not validate', function() {
        form.amount.$setViewValue(0);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(999999999999);
        expect(form.amount.$invalid).to.equal(true);
      });
    });

    describe('Unit: BTC', function() {
      beforeEach(inject(function($compile, $rootScope) {
        $scope = $rootScope;
        var w = $rootScope.wallet;
        w.settings.unitToSatoshi = 100000000;
        w.settings.unitName = 'BTC';
        w.settings.unitDecimals = 8;

        $rootScope.availableBalance = 0.04;
        var element = angular.element(
          '<form name="form">' +
          '<input type="number" id="amount" name="amount" placeholder="Amount" ng-model="amount" min="0.00000001" max="10000000000" valid-amount required>' +
          '</form>'
        );
        $scope.model = {
          amount: null
        };
        $compile(element)($scope);
        $scope.$digest();
        form = $scope.form;
      }));

      it('should validate', function() {
        form.amount.$setViewValue(0.01);
        expect(form.amount.$invalid).to.equal(false);
        form.amount.$setViewValue(0.039);
        expect(form.amount.$invalid).to.equal(false);
        form.amount.$setViewValue(100292.039);
        expect(form.amount.$invalid).to.equal(false);
      });

      it('should not validate', function() {
        form.amount.$setViewValue(0.039998888888888);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(0);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(0.0);
        expect(form.amount.$invalid).to.equal(true);
      });

    });

  });

  describe('Contact directive', function() {
    var element1, element2;

    beforeEach(inject(function($compile, $rootScope) {
      $rootScope.wallet = {
        addressBook: {
          '2MtBXKLtZuXGDshUcyH6yq7aZ33Snbb49pT': {
            label: ':)'
          }
        }
      }
      element1 = angular.element(
        '<contact address="2MtBXKLtZuXGDshUcyH6yq7aZ33Snbb49pT" />'
      );
      element2 = angular.element(
        '<contact address="2MvCKdnwEMiaexi247gi738U6pwUFZxbhXn" />'
      );
      $compile(element1)($rootScope);
      $compile(element2)($rootScope);
      $rootScope.$digest();
    }));

    it('should replace the content', function() {
      expect(element1.html()).to.equal(':)');
      expect(element2.html()).to.equal('2MvCKdnwEMiaexi247gi738U6pwUFZxbhXn');
    });

  });

  describe('Password strength', function() {
    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope;
      var element = angular.element(
        '<input type="password" name="password" ng-model="password" check-strength="passwordStrength" value="asd" required>'
      );
      $compile(element)($scope);
      $scope.$digest();
    }));

    it('should check very weak password', function() {
      $scope.password = 'asd';
      $scope.$digest();
      expect($scope.passwordStrength.strength).to.equal(1);
    });


    it('should check weak password', function() {
      $scope.password = 'asdasdASDASD';
      $scope.$digest();
      expect($scope.passwordStrength.message).to.equal('Weak, add numerals');
    });

    it('should check medium password', function() {
      $scope.password = 'asdasdA1';
      $scope.$digest();
      expect($scope.passwordStrength.message).to.equal('Medium, add punctuation');
    });

    it('should check strong password', function() {
      $scope.password = 'asdasdASDASD1{';
      $scope.$digest();
      expect($scope.passwordStrength.message).to.equal('Strong, add punctuation');
    });

  });

  describe('Match Password Inputs', function() {
    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope;
      $rootScope.availableBalance = 1000;
      var element = angular.element(
        '<form name="form">' +
        '<input type="password" ng-model="walletPassword" name="walletPassword" required>' +
        '<input type="password" ng-model="walletPasswordConfirm" name="walletPasswordConfirm" match="walletPassword" required>' +
        '</form>'
      );
      $scope.model = {
        walletPassword: null,
        walletPasswordConfirm: null
      };
      $compile(element)($scope);
      $scope.$digest();
      form = $scope.form;
    }));
    it('should not validate', function() {
      form.walletPassword.$setViewValue('mysecretpassword');
      form.walletPasswordConfirm.$setViewValue('mySecretPassword');
      $scope.$digest();
      expect(form.walletPasswordConfirm.$invalid).to.equal(true);
    });
    it('should validate', function() {
      form.walletPassword.$setViewValue('mysecretpassword123');
      form.walletPasswordConfirm.$setViewValue('mysecretpassword123');
      $scope.$digest();
      expect(form.walletPasswordConfirm.$invalid).to.equal(false);
    });
  });

});
