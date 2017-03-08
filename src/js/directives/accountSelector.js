'use strict';

angular.module('copayApp.directives')
  .directive('accountSelector', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/accountSelector.html',
      transclude: true,
      scope: {
        title: '=',
        itemLabel: '@?',
        show: '=',
        accounts: '=',
        selectedAccount: '=',
        onSelect: '='
      },
      link: function(scope, element, attrs) {
        scope.itemLabel = scope.itemLabel || 'Add account';
        scope.hide = function() {
          scope.show = false;
        };
        scope.selectAccount = function(account) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(account);
        };
      }
    };
  });
