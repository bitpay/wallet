'use strict';

angular.module('copay.controllerUtils').factory('controllerUtils', function ($rootScope, $location) {
  var root = {};
  root.setupUxHandlers =  function(w) {
    w.on('created', function() {
      $location.path('peer');
      $rootScope.wallet = w;
      
      // Initial getBalance
      $rootScope.wallet.getBalance(function(balance) {
        $rootScope.totalBalance = balance;
        $rootScope.$digest();
      });
    });
    w.on('refresh', function() {
      console.log('[controllerUtils.js] RECEIVED REFRESH'); //TODO
    });

    w.on('openError', function(){
      $scope.loading = false;
      $rootScope.flashMessage = {type:'error', message: 'Wallet not found'};
      $location.path('signin');
    });
  };

  return root;
});

