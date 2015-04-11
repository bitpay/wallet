'use strict';

angular.module('copayApp.controllers').controller('importController',
  function($scope, $rootScope, $location, $timeout, $log, profileService, notification, go, isMobile, isCordova, sjcl) {

    var self = this;

    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    var reader = new FileReader();

    window.ignoreMobilePause = true;
    $scope.$on('$destroy', function() {
      $timeout(function(){
        window.ignoreMobilePause = false;
      }, 100);
    });

    var _import = function(str, opts) {
      var str2;
      try {
       str2 = sjcl.decrypt(self.password, str);
      } catch (e) {
        self.error = 'Could not decrypt file, check your password';
        $log.warn(e);
        $scope.$apply();
        return;
      };

      self.loading = true;

      $timeout(function() {
        profileService.importWallet(str2, {
          compressed: null,
          password: null
        }, function(err, walletId) {
          self.loading = false;
          if (err) {
            self.error = err;
          }
          else {
            go.walletHome();
            notification.success('Success', 'Your wallet has been imported correctly');
          }
        });
      }, 100);
    };

    $scope.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          _import(evt.target.result);
        }
      }
    };

    this.import = function(form) {
      if (form.$invalid) {
        this.error = 'There is an error in the form';
        $scope.$apply();
        return;
      }

      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        this.error = 'Please, select your backup file';
        $scope.$apply();
        return;
      }

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      } else {
        _import(backupText);
      }
    };
  });
