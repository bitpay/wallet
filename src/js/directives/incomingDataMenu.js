'use strict';

angular.module('copayApp.directives')
  .directive('incomingDataMenu', function($timeout, $rootScope) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/incomingDataMenu.html',
      link: function(scope, element, attrs) {
        $rootScope.$on('incomingDataMenu.showMenu', function(event, data) {
          $timeout(function() {
            scope.data = data;
            scope.showMenu = true;
          });
        });
        scope.hide = function() {
          scope.showMenu = false;
        };
        scope.$watch('showMenu', function() {
          if(!scope.showMenu) {
            $rootScope.$broadcast('incomingDataMenu.menuHidden');
          }
        });
      }
    };
  });
