'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils, Passphrase) {
    $scope.loading = false;
    $scope.wallets = walletFactory.getWallets();
    $scope.selectedWalletId = $scope.wallets.length ? $scope.wallets[0].id : null;
    $scope.openPassword = '';

    $scope.create = function() {
      $scope.loading = true;

      $rootScope.walletName = $scope.walletName;
      $rootScope.walletPassword = $scope.createPassword;
      $location.path('setup');
    };

    $scope.open = function() {
      if ($scope.openPassword != '') {
        $scope.loading = true;

        var passphrase = Passphrase.getBase64($scope.openPassword);
        var w = walletFactory.open($scope.selectedWalletId, { passphrase: passphrase});
        controllerUtils.startNetwork(w);
      }
    };

    $scope.join = function() {
      $scope.loading = true;

      walletFactory.network.on('badSecret', function() {
      });

      walletFactory.joinCreateSession($scope.connectionId, $scope.nickname, function(err,w) {
        $scope.loading = false;

        if (err || !w) {
          if (err === 'joinError') 
            $rootScope.flashMessage = { message: 'Can not find peer'};
          else if (err === 'badSecret')  
            $rootScope.flashMessage = { message: 'Bad secret secret string', type: 'error'};
          else 
            $rootScope.flashMessage = { message: 'Unknown error', type: 'error'};
            controllerUtils.onErrorDigest();
        } else {
            var passphrase = Passphrase.getBase64($scope.joinPassword);
            w.storage._setPassphrase(passphrase);
            controllerUtils.startNetwork(w);
        }
      });
    };
  });
