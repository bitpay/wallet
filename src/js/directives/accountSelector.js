'use strict';

angular.module('copayApp.directives')
  .directive('accountSelector', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/accountSelector.html',
      transclude: true,
      scope: {
        title: '=accountSelectorTitle',
        show: '=accountSelectorShow',
        accounts: '=accountSelectorAccounts',
        selectedAccount: '=accountSelectorSelectedAccount',
        onSelect: '=accountSelectorOnSelect'
      },
      link: function(scope, element, attrs) {
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
