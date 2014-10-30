'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager, identityService) {
  controllerUtils.redirIfLogged();
  $scope.retreiving = true;

  identityService.check($scope);
  $scope.confirmedEmail = getParam('confirmed');
  $scope.openProfile = function(form) {
    if (form && form.$invalid) {
      notification.error('Error', 'Please enter the required fields');
      return;
    }
    $scope.loading = true;
    identityService.open($scope, form);
  }

  function getParam(sname) {
    var params = location.search.substr(location.search.indexOf("?") + 1);
    var sval = "";
    params = params.split("&");
    // split param and value into individual pieces
    for (var i = 0; i < params.length; i++) {
      var temp = params[i].split("=");
      if ([temp[0]] == sname) {
        sval = temp[1];
      }
    }
    return sval;
  }
});
