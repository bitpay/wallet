'use strict';

angular.module('copayApp.directives')
  .directive('actionSheet', function($rootScope) {
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
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        };
      }
    };
  });
