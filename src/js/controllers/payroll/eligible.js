'use strict';

angular.module('copayApp.controllers').controller('payrollEligibleController', function($scope, $log, $state, gettextCatalog, ongoingProcess, bitpayPayrollService, bitpayAccountService, popupService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.createAccount = data.stateParams && (data.stateParams.createAccount == 'true');
    $scope.employeeLabelRequired = false;
    $scope.qualifyingData = {
      email: '',
      label: ''
    };
    $scope.error = undefined;
  });

  $scope.checkIfEligible = function() {
    $scope.error = undefined;
    if ($scope.createAccount) {
      // Check if the email address is available.
      ongoingProcess.set('checkingAccountAvailability', true);
      bitpayAccountService.checkAccountAvailable($scope.qualifyingData.email, function(err, data) {
        ongoingProcess.set('checkingAccountAvailability', false);
        if (err) {
          $scope.error = err;
        } else  if (!data.available) {
          $scope.error = gettextCatalog.getString('Email address not available for account creation');
        } else {
          checkEligibility();
        }
      });
    } else {
      checkEligibility();
    }
  };

  var checkEligibility = function() {
    ongoingProcess.set('checkingPayrollEligible', true);
    bitpayPayrollService.checkIfEligible($scope.qualifyingData, function(err, record) {
      ongoingProcess.set('checkingPayrollEligible', false);

      if (err) {
        switch (err) {
          case 'EMPLOYEE_LABEL_REQUIRED':
            $scope.employeeLabelRequired = true;
            return;
            break;

          case 'EMPLOYEE_NOT_FOUND':
            return popupService.showAlert(
              gettextCatalog.getString('Not Eligible'),
              gettextCatalog.getString('You are not eligible for bitcoin payroll at this time. ' +
                'Please contact your employer and ask them to offer bitcoin payroll through BitPay. ' +
                'If you believe you entered the correct information please contact your employer to confirm your information and eligibility.'));

          default:
            return popupService.showAlert(gettextCatalog.getString('Error'), err);
            break;
        }
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
      }
    });
  };

});
