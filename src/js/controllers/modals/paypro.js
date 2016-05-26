'use strict';

angular.module('copayApp.controllers').controller('payproController', function($scope, profileService) {
  var self = $scope.self;

  $scope.alternative = self.alternativeAmount;
  $scope.alternativeIsoCode = self.alternativeIsoCode;
  $scope.isRateAvailable = self.isRateAvailable;
  $scope.unitTotal = ($scope.paypro.amount * self.satToUnit).toFixed(self.unitDecimals);
  $scope.unitName = self.unitName;

  $scope.cancel = function() {
    $scope.payproModal.hide();
    $scope.payproModal.remove();
  };
});
