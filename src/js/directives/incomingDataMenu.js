'use strict';

angular.module('copayApp.directives')
  .directive('incomingDataMenu', function($timeout, $rootScope) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/incomingDataMenu.html',
      link: function(scope, element, attrs) {
        $rootScope.$on('incomingDataMenu.showMenu', function() {
          console.log('in showMenu handler');
          $timeout(function() {
            console.log('in showMenu timeout');
            scope.showMenu = true;
          });
        });
        $timeout(function() {
          scope.showMenu = true;
        }, 2000);
        scope.hide = function() {
          scope.showMenu = false;
        };
        scope.$watch('showMenu', function() {
          console.log('scope.showMenu', scope.showMenu);
          if(!scope.showMenu) {
            $rootScope.$broadcast('incomingDataMenu.menuHidden');
          }
        });
      }
    };
  });
