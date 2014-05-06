'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils, Passphrase) {
    $scope.loading = false;
    $scope.wallets = walletFactory.getWallets();
    $scope.selectedWalletId = $scope.wallets.length ? $scope.wallets[0].id : null;
    $scope.openPassword = '';

    $scope.create = function(form) {
      if (form && form.$invalid) {
        $rootScope.flashMessage = { message: 'Please, enter required fields', type: 'error'};
        return;
      }

      $rootScope.walletName = form.walletName.$modelValue;
      $rootScope.walletPassword = form.createPassword.$modelValue;
      $location.path('setup');
    };

    $scope.open = function(form) {
      if (form && form.$invalid) {
        $rootScope.flashMessage = { message: 'Please, enter required fields', type: 'error'};
        return;
      }
      
      $scope.loading = true;
      var password = form.openPassword.$modelValue;
      var passphrase = Passphrase.getBase64(password);
      var w = walletFactory.open($scope.selectedWalletId, { passphrase: passphrase});
      if (!w) {
        $scope.loading = false;
        $rootScope.flashMessage = { message: 'Bad password or connection error', type: 'error'};
        return;
      }
      controllerUtils.startNetwork(w);
    };

    $scope.join = function(form) {
      if (form && form.$invalid) {
        $rootScope.flashMessage = { message: 'Please, enter required fields', type: 'error'};
        return;
      }
      $scope.loading = true;

      walletFactory.network.on('badSecret', function() {
      });

      var passphrase = Passphrase.getBase64($scope.joinPassword);
      walletFactory.joinCreateSession($scope.connectionId, $scope.nickname, passphrase, function(err,w) {
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
            controllerUtils.startNetwork(w);
        }
      });
    };
  });
