'use strict';

angular.module('copayApp.controllers').controller('passwordController',
  function($rootScope, $scope, $timeout,  profileService, notification, go, gettext) {

    var self = this;

    var pass1;

    self.isVerification = false;

    self.close = function(cb){
      return cb('No password given');
    };

    self.set = function(isSetup, cb){
      self.error = false;

      if (isSetup && !self.isVerification) {
        self.isVerification = true;
        pass1= self.password;
        self.password = null;
        $timeout(function(){
          $rootScope.$apply();
        })
        return;
      }
      if (isSetup) {
        if (pass1 != self.password) {
          self.error = gettext('Passwords do not match');
          self.isVerification = false;
          self.password = null;
          pass1 =null;

          return;
        }
      }
      return cb(null, self.password);
    };

  });
