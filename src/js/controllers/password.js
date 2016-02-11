'use strict';

angular.module('copayApp.controllers').controller('passwordController',
  function($rootScope, $scope, $timeout, profileService, notification, go, gettext) {

    var pass1;

    this.isVerification = false;

    document.getElementById("passwordInput").focus();

    this.close = function(cb) {
      return cb('No password given');
    };

    this.set = function(isSetup, cb) {
      this.loading = true;
      this.error = false;
      
      var self = this;

      $timeout(function() {
        if (isSetup && !self.isVerification) {
          self.loading = false;
          document.getElementById("passwordInput").focus();
          self.isVerification = true;
          pass1 = $scope.password;
          $scope.password = null;
          return;
        }
        if (isSetup && pass1 != $scope.password) {
          self.loading = false;
          self.error = gettext('Passwords do not match');
          self.isVerification = false;
          $scope.password = null;
          pass1 = null;
          return;
        }
        return cb(null, $scope.password);
      }, 100);
    };

  });
