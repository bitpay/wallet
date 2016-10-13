'use strict';

angular.module('copayApp.directives')
  .directive('actionSheet', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/actionSheet.html',
      transclude: true,
      scope: {
        show: '=actionSheetShow',
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
      }
    };
  });
