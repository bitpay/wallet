'use strict';

angular.module('copayApp.controllers').controller('payrollEligibleController', function($scope, $log, $state, gettextCatalog, bitpayPayrollService, popupService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.qualifyingData = {
      email: ''
    };
  });

  $scope.checkIfEligible = function() {
    bitpayPayrollService.checkIfEligible($scope.qualifyingData, function(err, record) {
      if (err) {
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      if (record == null) {
        $log.debug('Not payroll eligible: ' + $scope.qualifyingData.email);
        return popupService.showAlert(
          gettextCatalog.getString('Not Eligible'),
          gettextCatalog.getString('The email address provided ({{email}}) is not eligible for bitcoin payroll. ' +
            'Please contact your employer and ask them to offer bitcoin payroll through BitPay. ' +
            'If you believe you are using the correct email address please contact your employer to confirm your information and eligibility.', {
            email: $scope.qualifyingData.email
          }));
      } else {
        $state.go('tabs.payroll.summary');
      }
    });
  };

});
