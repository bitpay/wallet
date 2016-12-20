'use strict';

angular.module('copayApp.controllers').controller('payrollIntroController', function($scope, $state, externalLinkService) {

  $scope.payrollInfo = function() {
    var url = 'https://bitpay.com/payroll';
    externalLinkService.open(url);
  };

  $scope.setupPayroll = function() {
    return $state.transitionTo('tabs.payroll.depositAddress');
  };

});
