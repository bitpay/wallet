'use strict';

angular.module('copayApp.controllers').controller('createProfileController', function($rootScope, $scope, $log, $timeout, profileService, go) {
  var self = this;

  if (profileService.profile)
    go.walletHome();

  var pin='';
  // $rootScope.$on('pin', function(event, pin) {
    self.creatingProfile = true;

    $timeout(function() {
      profileService.create(pin, function(err) {
        if (err) {
          self.creatingProfile = false;
          $log.warn(err);
          self.error = err;
          $scope.$apply();
          $timeout(function() {
            go.reload();
          }, 3000);
        } else {
          go.walletHome();
        }
      });
     }, 100);
  // });
});
