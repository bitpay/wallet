'use strict';

angular.module('copayApp.directives')
  .directive('logOptions', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/logOptions.html',
      transclude: true,
      scope: {
        show: '=logOptionsShow',
        options: '=logOptions',
        fillClass: '=logOptionsFillClass',
        title: '=logOptionsTitle',
        onSelect: '=logOptionsOnSelect'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
        scope.getFillClass = function(index) {
          scope.onSelect(index);
        };
      }
    };
  });
