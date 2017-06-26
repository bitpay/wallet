'use strict';

angular.module('copayApp.directives')
  .directive('walletIcon', function($rootScope, $timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/walletIcon.html',
      scope: false,

      link: function(scope, element, attrs) {
        
      }
    };
  });
