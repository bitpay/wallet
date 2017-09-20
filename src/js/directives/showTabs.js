'use strict';
angular.module('copayApp.directives')
  .directive('showTabs', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      link: function($scope, $el) {
        $scope.$on("$ionicView.beforeEnter", function(event, data) {
          $rootScope.$apply(function() {
            $rootScope.hideTabs = '';
          });
        });
      }
    };
  });
