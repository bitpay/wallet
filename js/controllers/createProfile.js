'use strict';

angular.module('copayApp.controllers').controller('CreateProfileController', function($scope, $rootScope, $location, $timeout, notification, pluginManager, identityService, pinService, isMobile) {

  var _credentials, _firstpin;

  $scope.init = function() {
    identityService.goWalletHome();
    $scope.isMobile = isMobile.any();

    $scope.createStep = 'storage';
    $scope.useLocalstorage = false;

    pinService.makePinInput($scope, 'newpin', function(newValue) {
      _firstpin = newValue;
      $scope.askForPin = 2;
    });

    pinService.makePinInput($scope, 'repeatpin', function(newValue) {
      if (newValue === _firstpin) {
        _firstpin = null;
        $scope.createPin(newValue);
      } else {
        $scope.askForPin = 1;
        _firstpin = null;

        $scope.setPinForm.newpin.$setViewValue('');
        $scope.setPinForm.newpin.$render();
        $scope.setPinForm.repeatpin.$setViewValue('');
        $scope.setPinForm.repeatpin.$render();
        $scope.setPinForm.$setPristine();

        $scope.error = 'Entered PINs were not equal. Try again';
      }
    });
  };


  $scope.createPin = function(pin) {
    preconditions.checkArgument(pin);
    preconditions.checkState($rootScope.iden);
    preconditions.checkState(_credentials && _credentials.email);

    pinService.save(pin, _credentials.email, _credentials.password, function(err) {
      _credentials.password = '';
      _credentials = null;
      $scope.askForPin = 0;
      $rootScope.hasPin = true;
      $scope.createDefaultWallet();
    });
  };


  $scope.setStorage = function(useLocalstorage) {
    console.log('[createProfile.js.53:useLocalstorage:]', useLocalstorage); //TODO
    console.log('[createProfile.js.53:useLocalstorage:]', $scope.useLocalstorage); //TODO
    //settingsService.save({...})
    $scope.createStep = 'email';
    $scope.useEmail = !useLocalstorage;
    $scope.useLocalstorage = useLocalstorage;
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

  $scope.setEmailOrUsername = function(form) {
    console.log('[createProfile.js.53:useLocalstorage:]', $scope.useLocalstorage); //TODO

    $scope.userOrEmail = $scope.useLocalstorage ? form.username.$modelValue : form.email.$modelValue;
    preconditions.checkState($scope.userOrEmail);

    $scope.createStep = 'pass';
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };



  $scope.createDefaultWallet = function() {
    $rootScope.hideNavigation = false;
    identityService.createDefaultWallet(function(err) {
      $scope.askForPin = 0;
      $scope.loading = false;

      if (err) {
        var msg = err.toString();
        $scope.error = msg;
      }
    });
  };

  $scope.createProfile = function(form) {
    $rootScope.hideNavigation = false;
    if (form && form.$invalid) {
      $scope.error = 'Please enter the required fields';
      return;
    }
    $scope.loading = true;
    identityService.create( $scope.userOrEmail, form.password.$modelValue, function(err) {
      $scope.loading = false;

      if (err) {
        var msg = err.toString();
        if (msg.indexOf('EEXIST') >= 0 || msg.indexOf('BADC') >= 0) {
          msg = 'This profile already exists'
        }
        $timeout(function() {
          form.password.$setViewValue('');
          form.password.$render();
          form.repeatpassword.$setViewValue('');
          form.repeatpassword.$render();
          form.$setPristine();
          $scope.error = msg;
        }, 1);
        $scope.error = msg;
      } else {
        $scope.error = null;
        // mobile
        if ($scope.isMobile) {
          _credentials = {
            email: form.email.$modelValue,
            password: form.password.$modelValue,
          };
          $scope.askForPin = 1;
          $rootScope.hideNavigation = true;
          $timeout(function() {
            $rootScope.$digest();
          }, 1);

          return;
        } else {
          $scope.createDefaultWallet();
        }
      }
    });
  }
});
