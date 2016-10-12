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
        console.log('action sheet instantiated');
        scope.$watch('show', function() {
          console.log('show called', scope.show);
        });

        scope.hide = function() {
          scope.show = false;
        };
      }
    };
  });
