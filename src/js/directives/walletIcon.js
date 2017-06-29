'use strict';

angular.module('copayApp.directives')
  .directive('walletIcon', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      templateUrl: 'views/includes/walletIcon.html',
      scope: {wallet: '='},

      link: function(scope, element, attrs) {
        
      }
    };
  });
