'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils, Passphrase) {
    var cmp = function(o1, o2){
      var v1 = o1.show.toLowerCase(), v2 = o2.show.toLowerCase();
      return v1 > v2 ? 1 : ( v1 < v2 ) ? -1 : 0;
    };

    $scope.loading = $scope.failure = false;
    $scope.wallets = walletFactory.getWallets().sort(cmp);
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
      Passphrase.getBase64Async(password, function(passphrase){
        var w = walletFactory.open($scope.selectedWalletId, { passphrase: passphrase});
        if (!w) {
          $scope.loading = $scope.failure = false;
          $rootScope.flashMessage = { message: 'Bad password or connection error', type: 'error'};
          $rootScope.$digest();
          return;
        }
        controllerUtils.startNetwork(w);
        listenErrors(w);
      });
    };

    $scope.join = function(form) {
      if (form && form.$invalid) {
        $rootScope.flashMessage = { message: 'Please, enter required fields', type: 'error'};
        return;
      }

      $scope.loading = true;
      walletFactory.network.on('badSecret', function() {
      });

      Passphrase.getBase64Async($scope.joinPassword, function(passphrase){
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
              listenErrors(w);
          }
        });
      });
    };

    function listenErrors(wallet) {
      wallet.network.on('error', function(err) {
        $scope.failure = true;
      });
    }

  });
