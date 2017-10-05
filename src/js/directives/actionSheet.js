'use strict';

angular.module('copayApp.directives')
  .directive('actionSheet', function($rootScope, $timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/actionSheet.html',
      transclude: true,
      scope: {
        show: '=actionSheetShow',
      },
      link: function(scope, element, attrs) {
        scope.$watch('show', function() {
          if (scope.show) {
            $timeout(function() {
              scope.revealMenu = true;
            }, 100);
          } else {
            scope.revealMenu = false;
          }
        });
        scope.hide = function() {
          scope.show = false;
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        };
      }
    };
  });
