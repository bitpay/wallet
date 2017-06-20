'use strict';

angular.module('copayApp.directives')
  .directive('walletSelector', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/walletSelector.html',
      transclude: true,
      scope: {
        title: '=',
        show: '=',
        wallets: '=',
        selectedWallet: '=',
        onSelect: '='
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
        scope.selectWallet = function(wallet) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(wallet);
        };
      }
    };
  });
