'use strict';

angular.module('copayApp.directives')
  .directive('itemSelector', function ($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/itemSelector.html',
      transclude: true,
      scope: {
        label: '=itemSelectorLabel',
        show: '=itemSelectorShow',
        onSelect: '=itemSelectorOnSelect'
      },
      link: function (scope, element, attrs) {
        scope.hide = function () {
          scope.show = false;
        };
        scope.sendMax = function () {
          $timeout(function () {
            scope.hide();
          }, 100);
          scope.onSelect();
        };
      }
    };
  });
