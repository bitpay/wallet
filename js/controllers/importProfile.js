'use strict';

angular.module('copayApp.controllers').controller('ImportProfileController',
  function($scope, $rootScope, $location, $timeout, notification, isMobile, identityService) {
    $scope.title = 'Import a backup';
    $scope.importStatus = 'Importing wallet - Reading backup...';
    $scope.hideAdv = true;
    $scope.is_iOS = isMobile.iOS();

    window.ignoreMobilePause = true;
    $scope.$on('$destroy', function() {
      $timeout(function(){
        window.ignoreMobilePause = false;
      }, 100);
    });

    var reader = new FileReader();

    var updateStatus = function(status) {
      $scope.importStatus = status;
    }

    var _importBackup = function(str) {
      var password = $scope.password;
      updateStatus('Importing profile - Setting things up...');

      identityService.importProfile(str,password, function(err, iden) {
        $scope.loading = false;
        if (err) {
          copay.logger.warn(err);
          if ((err.toString() || '').match('BADSTR')) {
            $scope.error = 'Bad password or corrupt profile file';
          } else if ((err.toString() || '').match('EEXISTS')) {
            $scope.error = 'Profile already exists';
          } else {
            $scope.error = 'Unknown error';
          }
        } 
      });
    };

    $scope.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var encryptedObj = evt.target.result;
          _importBackup(encryptedObj);
        }
      };
    };

    $scope.import = function(form) {
      $scope.loading = true;

      if (form.$invalid) {
        $scope.loading = false;
        $scope.error = 'Please enter the required fields';
        return;
      }
      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        $scope.loading = false;
        $scope.error = 'Please, select your backup file';
        return;
      }

      $timeout(function() {
        if (backupFile) {
          reader.readAsBinaryString(backupFile);
        } else {
          _importBackup(backupText);
        }
      }, 1);
    };
  });
