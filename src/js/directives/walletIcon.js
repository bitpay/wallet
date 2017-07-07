'use strict';

angular.module('copayApp.directives')
  .directive('walletIcon', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      templateUrl: 'views/includes/walletIcon.html',
      scope: {wallet: '='},

      link: function(scope, element, attrs) {
        
        scope.bitlox = false;
        if(scope.wallet.isPrivKeyExternal() && scope.wallet.getPrivKeyExternalSourceName().indexOf('bitlox') > -1) {
          scope.bitlox = true;
        }

      }
    };
  });
