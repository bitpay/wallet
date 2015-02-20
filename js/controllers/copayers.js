'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $timeout, go, identityService, notification, isCordova) {
    var w = $rootScope.wallet;


    $scope.init = function() {
      $rootScope.title = 'Share this secret with your copayers';
      $scope.loading = false;
      $scope.secret = $rootScope.wallet.getSecret();
      $scope.isCordova = isCordova;

      w.on('publicKeyRingUpdated', $scope.updateList);
      w.on('ready', $scope.updateList);

      $scope.updateList();
    };

    $scope.updateList = function() {
      var w = $rootScope.wallet;

      $scope.copayers = $rootScope.wallet.getRegisteredPeerIds();
      if (w.isComplete()) {

        w.removeListener('publicKeyRingUpdated', $scope.updateList);
        w.removeListener('ready', $scope.updateList);
        go.walletHome();
      }
      $timeout(function() {
        $rootScope.$digest();
      }, 1);
    };

    $scope.deleteWallet = function() {
      $rootScope.starting = true;
      $timeout(function() {
        identityService.deleteWallet(w, function(err) {
          $rootScope.starting = false;
          if (err) {
            $scope.error = err.message || err;
            copay.logger.warn(err);
            $timeout(function () { $scope.$digest(); });
          } else {
            if ($rootScope.wallet) {
              go.walletHome();
            }
            $timeout(function() {
              notification.success('Success', 'The wallet "' + (w.name || w.id) + '" was deleted');
            });
          }
        });
      }, 100);
    };

    $scope.copySecret = function(secret) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(secret);
        window.plugins.toast.showShortCenter('Copied to clipboard');
      }
    };

    $scope.shareSecret = function(secret) {
      if (isCordova) {
        if (isMobile.Android() || isMobile.Windows()) {
          window.ignoreMobilePause = true;
        }
        window.plugins.socialsharing.share(secret, null, null, null);
      }
    };

  });
