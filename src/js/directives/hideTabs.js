'use strict';
angular.module('copayApp.directives')
.directive('hideTabs', function($rootScope, $timeout) {
  return {
    restrict: 'A',
    link: function($scope, $el) {
      $scope.$on("$ionicView.beforeEnter", function(event, data){
        $timeout(function() {
          $rootScope.hideTabs = 'tabs-item-hide';
          $rootScope.$apply();
        });
      });
    }
  };
});
