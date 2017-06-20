'use strict';

angular.module('copayApp.controllers').controller('payrollAboutController', function($scope, $state, $log, bitpayPayrollService, lodash, uxLanguage, externalLinkService, gettextCatalog, popupService) {

  $scope.lang = uxLanguage.currentLanguage;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (data.stateParams && data.stateParams.id) {
      bitpayPayrollService.getPayrollRecordById(data.stateParams.id, function(err, record) {
        if (err) {
          return showError(err);
        }

        if (!record) {
          return showError(
            'No payroll record found when loading payrollAboutController',
            gettextCatalog.getString('Error'),
            gettextCatalog.getString('No payroll settings specified.'));
        }

        $scope.payrollRecord = record;
      });
    } else {
      return showError(
        'No payroll record id specified when loading payrollAboutController',
        gettextCatalog.getString('Error'),
        gettextCatalog.getString('No payroll settings specified.'));
    }
  });

  $scope.viewBitPayTerms = function() {
    var url = 'https://bitpay.com/payroll';
    var optIn = true;
    var title = gettextCatalog.getString('View Terms of Service');
    var message = gettextCatalog.getString('The official English Terms of Service are available on the BitPay website.');
    var okText = gettextCatalog.getString('Open Website');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  function showError(err, title, message) {
    var title = title || gettextCatalog.getString('Error');
    var message = message || gettextCatalog.getString('Could not save find payroll settings.');
    $log.error(err);
    return popupService.showAlert(title, message);
  };

});
