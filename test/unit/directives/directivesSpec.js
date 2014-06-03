'use strict';
//
// test/unit/directives/directivesSpec.js
//
describe("Unit: Testing Directives", function() {

  var $scope, form;

  beforeEach(module('copayApp.directives'));

  describe('Validate Address', function() {
    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope;
      var element = angular.element(
        '<form name="form">' +
        '<input type="text" id="address" name="address" placeholder="Send to" ng-model="address" valid-address required>' +
        '</form>'
        );
      $scope.model = { address: null };
      $compile(element)($scope);
      $scope.$digest();
      form = $scope.form;
    }));

    it('should validate', function() {
      form.address.$setViewValue('mkfTyEk7tfgV611Z4ESwDDSZwhsZdbMpVy');
      expect(form.address.$invalid).to.equal(false);
    });
    it('should not validate', function() {
      form.address.$setViewValue('thisisaninvalidaddress');
      expect(form.address.$invalid).to.equal(true);
    });
  });

  describe('Validate Amount', function() {
    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope;
      $rootScope.availableBalance = 2;
      var element = angular.element(
        '<form name="form">' +
        '<input type="number" id="amount" name="amount" placeholder="Amount" ng-model="amount" min="0.0001" max="10000000" enough-amount required>' +
        '</form>'
        );
      $scope.model = { amount: null };
      $compile(element)($scope);
      $scope.$digest();
      form = $scope.form;
    }));

    it('should validate between min and max value', function() {
      form.amount.$setViewValue(1.2);
      expect(form.amount.$invalid).to.equal(false);
    });
    it('should not validate between min and max value', function() {
      form.amount.$setViewValue(0);
      expect(form.amount.$invalid).to.equal(true);
      form.amount.$setViewValue(9999999999999);
      expect(form.amount.$invalid).to.equal(true);
    });
    it('should not validate because not enough amount', function() {
      form.amount.$setViewValue(2.1);
      expect(form.amount.$invalid).to.equal(true);
    });
  });

});
