'use strict';

angular.module('copayApp.controllers').controller('preferencesCoinbaseController', function($scope, $timeout, $state, $ionicHistory, lodash, ongoingProcess, popupService, coinbaseService) {

  $scope.revokeToken = function() {
    popupService.showConfirm('Coinbase', 'Are you sure you would like to log out of your Coinbase account?', null, null, function(res) {
      if (res) {
        coinbaseService.logout(function() {
          $ionicHistory.clearHistory();
          $timeout(function() {
            $state.go('tabs.home');
          }, 100);
        });
      }
    });
  };

  $scope.$on("$ionicView.enter", function(event, data){
    coinbaseService.setCredentials();
    $scope.network = coinbaseService.getEnvironment();
    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init(function(err, data) {
      if (err || lodash.isEmpty(data)) {
        ongoingProcess.set('connectingCoinbase', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
        }
        return;
      }
      var accessToken = data.accessToken;
      var accountId = data.accountId;
      coinbaseService.getAccount(accessToken, accountId, function(err, account) {
        ongoingProcess.set('connectingCoinbase', false);
        $scope.coinbaseAccount = account.data;
      });
      coinbaseService.getCurrentUser(accessToken, function(err, user) {
        $scope.coinbaseUser = user.data;
      });
    });
  });

});
