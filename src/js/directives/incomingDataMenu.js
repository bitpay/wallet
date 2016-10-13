'use strict';

angular.module('copayApp.directives')
  .directive('incomingDataMenu', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/incomingDataMenu.html',
      link: function(scope, element, attrs) {
        console.log('incomingDataMenu constructed');
        $timeout(function() {
          scope.showMenu = true;
        }, 5000);

      }
    };
  });
