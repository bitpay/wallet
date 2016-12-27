'use strict';

angular.module('copayApp.directives')
  .directive('sendMax', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/sendMax.html',
      transclude: true,
      scope: {
        show: '=sendMaxShow',
        onSelect: '=sendMaxOnSelect'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
        scope.sendMax = function() {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect();
        };
      }
    };
  });
