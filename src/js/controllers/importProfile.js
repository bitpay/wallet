'use strict';

angular.module('copayApp.controllers').controller('importProfileController',
  function($scope, $rootScope, $timeout, notification, isMobile, isCordova, identityService) {
    this.importStatus = 'Importing profile - Reading backup...';
    this.hideAdv = true;
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;

    window.ignoreMobilePause = true;
    $scope.$on('$destroy', function() {
      $timeout(function(){
        window.ignoreMobilePause = false;
      }, 100);
    });

    var reader = new FileReader();

    var updateStatus = function(status) {
      this.importStatus = status;
    }

    var _importBackup = function(str) {
      var password = this.password;
      updateStatus('Importing profile - Setting things up...');

      identityService.importProfile(str,password, function(err, iden) {
        if (err) {
          $rootScope.starting = false;
          copay.logger.warn(err);
          if ((err.toString() || '').match('BADSTR')) {
            this.error = 'Bad password or corrupt profile file';
          } else if ((err.toString() || '').match('EEXISTS')) {
            this.error = 'Profile already exists';
          } else {
            this.error = 'Unknown error';
          }
          $timeout(function() {
            $rootScope.$digest();
          }, 1);
        } 
      });
    };

    this.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var encryptedObj = evt.target.result;
          _importBackup(encryptedObj);
        }
      };
    };

    this.import = function(form) {

      if (form.$invalid) {
        this.error = 'Please enter the required fields';
        return;
      }
      var backupFile = this.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        this.error = 'Please, select your backup file';
        return;
      }
      
      $rootScope.starting = true;

      $timeout(function() {

        if (backupFile) {
          reader.readAsBinaryString(backupFile);
        } else {
          _importBackup(backupText);
        }
      }, 100);
    };
  });
