'use strict';

angular.module('copayApp.controllers').controller('JoinController',
  function($scope, $rootScope, walletFactory, controllerUtils, Passphrase, notification) {
    $scope.loading = false;
    
    $scope.join = function(form) {
      if (form && form.$invalid) {
        notification.error('Error', 'Please enter the required fields');
        return;
      }

      $scope.loading = true;
      walletFactory.network.on('badSecret', function() {});

      Passphrase.getBase64Async($scope.joinPassword, function(passphrase) {
        walletFactory.joinCreateSession($scope.connectionId, $scope.nickname, passphrase, function(err, w) {
          $scope.loading = false;
          if (err || !w) {
            if (err === 'joinError')
              notification.error('Can\'t find peer.');
            else if (err === 'walletFull')
              notification.error('The wallet is full');
            else if (err === 'badNetwork')
              notification.error('Network Error', 'The wallet your are trying to join uses a different Bitcoin Network. Check your settings.');
            else if (err === 'badSecret')
              notification.error('Bad secret', 'The secret string you entered is invalid');
            else
              notification.error('Unknown error');
            controllerUtils.onErrorDigest();
          } else {
            controllerUtils.startNetwork(w, $scope);
          }
        });
      });
    }
  });
