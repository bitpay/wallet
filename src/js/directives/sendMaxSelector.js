'use strict';

angular.module('copayApp.directives')
  .directive('sendMaxSelector', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/sendMaxSelector.html',
      transclude: true,
      scope: {
        show: '=sendMaxSelectorShow',
        wallet: '=sendMaxSelectorWallet',
        onSelect: '=sendMaxSelectorOnSelect'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
        scope.setSendMax = function() {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect();
        };
      }
    };
  });
