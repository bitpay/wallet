'use strict';

angular.module('copayApp.directives')
  .directive('networkSelector', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/networkSelector.html',
      transclude: true,
      scope: {
        title: '=networkSelectorTitle',
        show: '=networkSelectorShow',
        networks: '=networkSelectorNetworks',
        selectedNetwork: '=networkSelectorSelectedNetwork',
        onSelect: '=networkSelectorOnSelect'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
        scope.selectNetwork = function(network) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(network);
        };
      }
    };
  });
