'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, $timeout, notification, identityService, Compatibility) {
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

  Compatibility.check($scope);

  $scope.done = function() {
    $rootScope.starting = false;
    $rootScope.$digest();
  };


  $scope.$on("$destroy", function(){
    var iden = $rootScope.iden;
    if (iden) {
      iden.removeListener('newWallet', $scope.done );
      iden.removeListener('noWallets', $scope.done );
    }
  });


  $scope.openProfile = function(form) {
    $scope.confirmedEmail = false;
    if (form && form.$invalid) {
      $scope.error = 'Please enter the required fields';
      return;
    }
    $rootScope.starting = true;
    identityService.open(form.email.$modelValue, form.password.$modelValue, function(err, iden) {
     if (err) {
        $rootScope.starting = false;
        copay.logger.warn(err);
        if ((err.toString() || '').match('PNOTFOUND')) {
          $scope.error = 'Invalid email or password';
        } else if ((err.toString() || '').match('Connection')) {
          $scope.error = 'Could not connect to Insight Server';
        } else if ((err.toString() || '').match('Unable')) {
          $scope.error = 'Unable to read data from the Insight Server';
        } else {
          $scope.error = 'Unknown error';
        }
        return $scope.done();
      }

      if (iden) {
        iden.on('newWallet', $scope.done);
        iden.on('noWallets', $scope.done);
        iden.openWallets();
      }
    });
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
