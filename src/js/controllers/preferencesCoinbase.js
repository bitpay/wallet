'use strict';

angular.module('copayApp.controllers').controller('preferencesCoinbaseController', function($scope, $timeout, $log, $state, $ionicHistory, lodash, ongoingProcess, popupService, coinbaseService) {

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
    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init(function(err, data) {
      if (err || lodash.isEmpty(data)) {
        ongoingProcess.set('connectingCoinbase', false);
        if (err) {
          $log.error(err);
          var errorId = err.errors ? err.errors[0].id : null;
          err = err.errors ? err.errors[0].message : err;
          popupService.showAlert('Error connecting to Coinbase', err, function() {
            if (errorId == 'revoked_token') {
              coinbaseService.logout(function() {});
              $ionicHistory.goBack();
            }
          });
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
