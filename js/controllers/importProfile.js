'use strict';

angular.module('copayApp.controllers').controller('ImportProfileController',
  function($scope, $rootScope, $location, $timeout, notification, isMobile, isCordova, identityService) {
    $scope.title = 'Import a backup';
    $scope.importStatus = 'Importing wallet - Reading backup...';
    $scope.hideAdv = true;
    $scope.is_iOS = isMobile.iOS();
    $scope.isCordova = isCordova;

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
        if (err) {
          $rootScope.starting = false;
          copay.logger.warn(err);
          if ((err.toString() || '').match('BADSTR')) {
            $scope.error = 'Bad password or corrupt profile file';
          } else if ((err.toString() || '').match('EEXISTS')) {
            $scope.error = 'Profile already exists';
          } else {
            $scope.error = 'Unknown error';
          }
          $timeout(function() {
            $rootScope.$digest();
          }, 1);
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

      if (form.$invalid) {
        $scope.error = 'Please enter the required fields';
        return;
      }
      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        $scope.error = 'Please, select your backup file';
        return;
      }
      
      $rootScope.starting = true;

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      } else {
        _importBackup(backupText);
      }
    };
  });
