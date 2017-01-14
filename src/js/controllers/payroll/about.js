'use strict';

angular.module('copayApp.controllers').controller('payrollAboutController', function($scope, $state, bitpayPayrollService, lodash, uxLanguage, externalLinkService, gettextCatalog) {

  $scope.lang = uxLanguage.currentLanguage;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    bitpayPayrollService.getPayrollRecords(function(err, records) {
      if (err) {
        return showError(err);
      }

      var record = $scope.payrollRecord = lodash.find(records, function(r) {
        return r.id == data.stateParams.id;
      });

      if (!$scope.payrollRecord) {
        return showError(
          'No payroll record found when loading payrollConfirmController',
          gettextCatalog.getString('Error'),
          gettextCatalog.getString('No payroll settings specified.'));
      }
    });
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

});
