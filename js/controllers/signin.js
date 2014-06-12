'use strict';

angular.module('copayApp.controllers').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils, Passphrase) {
    var cmp = function(o1, o2){
      var v1 = o1.show.toLowerCase(), v2 = o2.show.toLowerCase();
      return v1 > v2 ? 1 : ( v1 < v2 ) ? -1 : 0;
    };
    $rootScope.videoInfo = {};
    $scope.loading = false;
    $scope.wallets = walletFactory.getWallets().sort(cmp);
    $scope.selectedWalletId = $scope.wallets.length ? $scope.wallets[0].id : null;
    $scope.openPassword = '';

    $scope.open = function(form) {
      if (form && form.$invalid) {
        $rootScope.$flashMessage = { message: 'Please, enter required fields', type: 'error'};
        return;
      }
      
      $scope.loading = true;
      var password = form.openPassword.$modelValue;

      Passphrase.getBase64Async(password, function(passphrase){
        var w, errMsg;
        try{
          var w = walletFactory.open($scope.selectedWalletId, { passphrase: passphrase});
        } catch (e){
          errMsg = e.message;
        };
        if (!w) {
          $scope.loading = false;
          $rootScope.$flashMessage = { message: errMsg || 'Wrong password', type: 'error'};
          $rootScope.$digest();
          return;
        }
        controllerUtils.startNetwork(w, $scope);
      });
    };

    $scope.join = function(form) {
      if (form && form.$invalid) {
        $rootScope.$flashMessage = { message: 'Please, enter required fields', type: 'error'};
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
              $rootScope.$flashMessage = { message: 'Can not find peer'};
            else if (err === 'walletFull')
              $rootScope.$flashMessage = { message: 'The wallet is full', type: 'error'};
            else if (err === 'badNetwork')
              $rootScope.$flashMessage = { message: 'The wallet your are trying to join uses a different Bitcoin Network. Check your settings.', type: 'error'};
            else if (err === 'badSecret')  
              $rootScope.$flashMessage = { message: 'Bad secret secret string', type: 'error'};
            else 
              $rootScope.$flashMessage = { message: 'Unknown error', type: 'error'};
            controllerUtils.onErrorDigest();
          } else {
              controllerUtils.startNetwork(w, $scope);
          }
        });
      });
    }
  });
