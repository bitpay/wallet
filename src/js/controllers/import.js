'use strict';

angular.module('copayApp.controllers').controller('importController',
  function($scope, $rootScope, $location, $timeout, profileService, notification, go, isMobile, isCordova) {

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
      profileService.importWallet(str, {
        compressed: null,
        password: null
      }, function(err) {
        if (err) {
          $scope.error = err;
          $scope.$apply();
        }
        else {
          go.walletHome();
          notification.success('Success', 'Your wallet has been imported correctly');
        }
      });
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
      var fc = profileService.focusedClient;

      if (form.$invalid) {
        this.error = 'There is an error in the form';
        return;
      }

      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        this.error = 'Please, select your backup file';
        return;
      }

      $timeout(function() {
        if (backupFile) {
          reader.readAsBinaryString(backupFile);
        } else {
          _import(backupText);
        }
      }, 100);
    };
  });
