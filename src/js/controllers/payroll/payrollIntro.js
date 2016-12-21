'use strict';

angular.module('copayApp.controllers').controller('payrollIntroController', function($scope, $state, $ionicHistory, configService, externalLinkService) {

  $scope.payrollInfo = function() {
    var url = 'https://bitpay.com/payroll';
    externalLinkService.open(url);
  };

  $scope.setupPayroll = function() {
    return $state.transitionTo('tabs.payroll.depositAddress');
  };

  function returnToState(name) {
    for( var viewObj in $ionicHistory.viewHistory().views) {
      if( $ionicHistory.viewHistory().views[viewObj].stateName == name ) {
        $ionicHistory.backView($ionicHistory.viewHistory().views[viewObj]);
      }
    }
    $ionicHistory.goBack();
  };

  $scope.goBackToSettings = function() {
    returnToState('tabs.settings');
  };

});
