'use strict';

angular.module('copayApp.directives')
  .directive('incomingDataMenu', function($timeout, $rootScope) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/incomingDataMenu.html',
      link: function(scope, element, attrs) {
        $rootScope.$on('incomingDataMenu.showMenu', function() {
          scope.showMenu = true;
        });
        scope.$watch('showMenu', function() {
          console.log('scope.showMenu', scope.showMenu);
          if(!scope.showMenu) {
            $rootScope.$broadcast('incomingDataMenu.menuHidden');
          }
        });
      }
    };
  });
