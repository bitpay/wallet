'use strict';

angular.module('copayApp.controllers').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils, Passphrase, backupService, notification) {
    var cmp = function(o1, o2) {
      var v1 = o1.show.toLowerCase(),
        v2 = o2.show.toLowerCase();
      return v1 > v2 ? 1 : (v1 < v2) ? -1 : 0;
    };
    $rootScope.videoInfo = {};
    $scope.loading = false;
    $scope.wallets = walletFactory.getWallets().sort(cmp);
    $scope.selectedWalletId = $scope.wallets.length ? $scope.wallets[0].id : null;
    $scope.openPassword = '';

    if ($rootScope.pendingPayment) {
      notification.info('Login Required', 'Please open wallet to complete payment');
    }

    $scope.open = function(form) {
      if (form && form.$invalid) {
        notification.error('Error', 'Please enter the required fields');
        return;
      }

      $scope.loading = true;
      var password = form.openPassword.$modelValue;

      Passphrase.getBase64Async(password, function(passphrase) {
        var w, errMsg;
        try {
          var w = walletFactory.open($scope.selectedWalletId, {
            passphrase: passphrase
          });
        } catch (e) {
          errMsg = e.message;
        };
        if (!w) {
          $scope.loading = false;
          notification.error('Error', errMsg || 'Wrong password');
          $rootScope.$digest();
          return;
        }
        controllerUtils.startNetwork(w, $scope);
      });
    };

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
            backupService.download(w);
            controllerUtils.startNetwork(w, $scope);
          }
        });
      });
    }
  });
