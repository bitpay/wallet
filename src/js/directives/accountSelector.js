'use strict';

angular.module('copayApp.directives')
  .directive('accountSelector', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/accountSelector.html',
      transclude: true,
      scope: {
        title: '=',
        items: '=?',
        show: '=',
        accounts: '=',
        selectedAccount: '=',
        onSelect: '='
      },
      link: function(scope, element, attrs) {
        scope.items = scope.items || [{label: 'Connect account', icon: 'img/icon-account-link.svg'}];
        scope.hide = function() {
          scope.show = false;
        };
        scope.select = function(accountOrIndex) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(accountOrIndex);
        };
      }
    };
  });
