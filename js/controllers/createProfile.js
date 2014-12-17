'use strict';

angular.module('copayApp.controllers').controller('CreateProfileController', function($scope, $rootScope, $location, $timeout, notification, pluginManager, identityService, pinService, isMobile, configService, go) {

  var _credentials, _firstpin;

  $scope.init = function() {

    if ($rootScope.wallet)
      go.walletHome();

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
    $rootScope.starting = true;

    $timeout(function() {
      pinService.save(pin, _credentials.email, _credentials.password, function(err) {
        _credentials.password = '';
        _credentials = null;
        $scope.askForPin = 0;
        $rootScope.hasPin = true;
        $rootScope.starting = null;
        $scope.createDefaultWallet();
      });
    }, 100);
  };


  $scope.setStep = function(step) {
    $scope.error = null;
    $scope.createStep = step;
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

  $scope.selectStorage = function(storage) {
    $scope.useLocalstorage = storage == 'local';
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

  $scope.goToEmail = function() {
    $scope.createStep = 'email';
    $scope.useEmail = !$scope.useLocalstorage;
  };

  $scope.setEmailOrUsername = function(form) {
    $scope.userOrEmail = $scope.useLocalstorage ? form.username.$modelValue : form.email.$modelValue;
    preconditions.checkState($scope.userOrEmail);

    $scope.error = null;
    $scope.createStep = 'pass';
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

  $scope.createDefaultWallet = function() {
    $rootScope.hideNavigation = false;
    identityService.createDefaultWallet(function(err) {
      $scope.askForPin = 0;

      if (err) {
        var msg = err.toString();
        $scope.error = msg;
      }
    });
  };

  $scope._doCreateProfile = function(emailOrUsername, password, cb) {
    preconditions.checkArgument(_.isString(emailOrUsername));
    preconditions.checkArgument(_.isString(password));

    $rootScope.hideNavigation = false;
    $rootScope.starting = true;

    identityService.create(emailOrUsername, password, function(err) {
      $rootScope.starting = null;
      $scope.error = null;
      if (err) {
        var msg = err.toString();
        if (msg.indexOf('EEXIST') >= 0 || msg.indexOf('BADC') >= 0) {
          msg = 'This profile already exists'
          $scope.createStep = 'email';
        }
        if (msg.indexOf('EMAILERROR') >= 0) {
          msg = 'Could not send verification email. Please check your email address.';
          $scope.createStep = 'email';
        }
        $scope.error = msg;
      } else {
        // mobile
        if ($scope.isMobile) {
          _credentials = {
            email: emailOrUsername,
            password: password,
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
      return cb();
    });
  };


  $scope.saveSettings = function(cb) {
    var plugins = config.plugins;

    plugins.EncryptedLocalStorage = false;
    plugins.EncryptedInsightStorage = false;

    var pluginName = $scope.useLocalstorage ? 'EncryptedLocalStorage' : 'EncryptedInsightStorage';
    plugins[pluginName] = true;

    configService.set({
      plugins: plugins
    }, cb);
  };


  $scope.createProfile = function(form) {
    if (form && form.$invalid) {
      $scope.error = 'Please enter the required fields';
      return;
    }

    $scope.saveSettings(function(err) {
      preconditions.checkState(!err, err);

      $scope._doCreateProfile($scope.userOrEmail, form.password.$modelValue, function(err) {
        $timeout(function() {
          form.password.$setViewValue('');
          form.password.$render();
          form.repeatpassword.$setViewValue('');
          form.repeatpassword.$render();
          form.$setPristine();
        }, 1);
      });
    });
  };
});
