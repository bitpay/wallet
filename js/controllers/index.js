'use strict';

angular.module('copayApp.controllers').controller('IndexController', function($scope, go, isCordova) {
  $scope.init = function() {

  };

  $scope.swipe = function(invert) {
    if (isCordova) { 
      go.swipe(invert);
    }
  };

});
