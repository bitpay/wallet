'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager, identityService, Compatibility) {
  controllerUtils.redirIfLogged();

  // This is only for backwards compat, insight api should link to #!/confirmed directly
  if (getParam('confirmed')) {
    var hashIndex = window.location.href.indexOf('/?');
    window.location = window.location.href.substr(0, hashIndex) + '#!/confirmed';
    return;
  }


  if ($rootScope.fromEmailConfirmation) {
    $scope.confirmedEmail = true;
    $rootScope.fromEmailConfirmation = false;
  }

  $scope.retreiving = false;
  Compatibility.check($scope);

  $scope.openProfile = function(form) {
    $scope.confirmedEmail = false;
    if (form && form.$invalid) {
      $scope.error = 'Please enter the required fields';
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
