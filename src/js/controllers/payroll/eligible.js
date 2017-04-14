'use strict';

angular.module('copayApp.controllers').controller('payrollEligibleController', function($scope, $log, $state, gettextCatalog, bitpayPayrollService, bitpayAccountService, popupService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.createAccount = data.stateParams && (data.stateParams.createAccount == 'true');
    $scope.qualifyingData = {
      email: ''
    };
  });

  $scope.checkIfEligible = function() {
    bitpayPayrollService.checkIfEligible($scope.qualifyingData, function(err, record) {
      if (err) {
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }

      if (record.eligibility.eligible && !record.employee.verified) {

        $state.go('tabs.payroll.summary').then(function() {
          return popupService.showAlert(
            gettextCatalog.getString('Eligible'),
            gettextCatalog.getString('You are eligible for Bitcoin payroll! ' +
              'We have sent a confirmation email to {{email}}.  Please check your email to continue payroll setup.', {
              email: record.eligibility.qualifyingData.email
            })
          );
        });

      } else if (record.eligibility.eligible && record.employee.verified) {

        $state.go('tabs.payroll.summary').then(function() {
          return popupService.showAlert(
            gettextCatalog.getString('Eligible'),
            gettextCatalog.getString('You are eligible for Bitcoin payroll! ' +
              'Continue payroll setup by tapping the \'Setup\' button on your payroll card in this view.'));
        });

      } else {

        return popupService.showAlert(
          gettextCatalog.getString('Not Eligible'),
          gettextCatalog.getString('The email address provided ({{email}}) is not eligible for bitcoin payroll. ' +
            'Please contact your employer and ask them to offer bitcoin payroll through BitPay. ' +
            'If you believe you are using the correct email address please contact your employer to confirm your information and eligibility.', {
            email: record.eligibility.qualifyingData.email
          }));
      }
    });
  };

});
