'use strict';
//
// test/unit/directives/directivesSpec.js
//
describe("Unit: Testing Directives", function() {

  var $scope, form;

  beforeEach(module('copayApp.directives'));

  beforeEach(function() {
    config.unitToSatoshi = 100;
    config.unitName = 'bits';
  });

  describe('Check config', function() {
    it('unit should be set to BITS in config.js', function() {
      expect(config.unitToSatoshi).to.equal(100);
      expect(config.unitName).to.equal('bits');
    });
  });

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

    it('should validate with network', function() {
      config.networkName = 'testnet';
      form.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      expect(form.address.$invalid).to.equal(false);
    });
    it('should not validate with other network', function() {
      config.networkName = 'livenet';
      form.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      expect(form.address.$invalid).to.equal(true);
    });
    it('should not validate random', function() {
      form.address.$setViewValue('thisisaninvalidaddress');
      expect(form.address.$invalid).to.equal(true);
    });
  });

  describe('Validate Amount', function() {
    describe('Unit: bits', function() {
      beforeEach(inject(function($compile, $rootScope) {
        $scope = $rootScope;
        $rootScope.availableBalance = 1000;
        var element = angular.element(
          '<form name="form">' +
          '<input type="number" id="amount" name="amount" placeholder="Amount" ng-model="amount" min="0.0001" max="10000000" enough-amount required>' +
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
        expect($scope.notEnoughAmount).to.equal(null);
      });

      it('should not validate', function() {
        form.amount.$setViewValue(0);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(9999999999);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(901);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(1000);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(901);
        expect($scope.notEnoughAmount).to.equal(true);
      });
    });

    describe('Unit: BTC', function() {
      beforeEach(inject(function($compile, $rootScope) {
        config.unitToSatoshi = 100000000;
        config.unitName = 'BTC';
        $scope = $rootScope;
        $rootScope.availableBalance = 0.04;
        var element = angular.element(
          '<form name="form">' +
          '<input type="number" id="amount" name="amount" placeholder="Amount" ng-model="amount" min="0.0001" max="10000000" enough-amount required>' +
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
        expect($scope.notEnoughAmount).to.equal(null);
        expect(form.amount.$invalid).to.equal(false);
        form.amount.$setViewValue(0.039);
        expect($scope.notEnoughAmount).to.equal(null);
        expect(form.amount.$invalid).to.equal(false);
      });

      it('should not validate', function() {
        form.amount.$setViewValue(0.03999);
        expect($scope.notEnoughAmount).to.equal(true);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(0);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(0.0);
        expect(form.amount.$invalid).to.equal(true);
        form.amount.$setViewValue(0.05);
        expect($scope.notEnoughAmount).to.equal(true);
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
      expect($scope.passwordStrength).to.equal('very weak');
    });

    it('should check weak password', function() {
      $scope.password = 'asdasdASDASD';
      $scope.$digest();
      expect($scope.passwordStrength).to.equal('weak');
    });

    it('should check medium password', function() {
      $scope.password = 'asdasdASDASD1';
      $scope.$digest();
      expect($scope.passwordStrength).to.equal('medium');
    });

    it('should check strong password', function() {
      $scope.password = 'asdasdASDASD1{';
      $scope.$digest();
      expect($scope.passwordStrength).to.equal('strong');
    });

  });
});
