'use strict';

angular.module('copayApp.controllers').controller('createProfileController', function($rootScope, $location, $timeout, $window, notification, pluginManager, identityService, pinService, isMobile, isCordova, configService, go) {

  var _credentials;

  this.init = function() {

    if ($rootScope.wallet)
      go.walletHome();

    this.isMobile = isMobile.any();
    this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
    this.hideForWP = 0;
    this.digits = [];
    this.defined = [];
    this.askForPin = 0;
  };

  this.clear = function() {
    pinService.clearPin(this);
  };

  this.press = function(digit) {
    pinService.pressPin(this, digit, true);
  };

  this.skip = function () {
    pinService.skipPin(this, true);
  };

  this.formFocus = function() {
    if (!this.isWindowsPhoneApp) return
    this.hideForWP = true;
    $timeout(function() {
      this.$digest();
    }, 1);
  };

  this.createPin = function(pin) {
    $rootScope.starting = true;

    $timeout(function() {
      pinService.save(pin, _credentials.username, _credentials.password, function(err) {
        _credentials.password = '';
        _credentials = null;
        this.askForPin = 0;
        $rootScope.hasPin = true;
        this.createDefaultWallet();
      });
    }, 100);
  };

  /* Last step. Will emit after creation so the UX gets updated */
  this.createDefaultWallet = function() {
    $rootScope.hideNavigation = false;
    $rootScope.starting = true;
    identityService.createDefaultWallet(function(err) {
      this.askForPin = 0;
      $rootScope.starting = null;

      if (err) {
        var msg = err.toString();
        this.error = msg;
      } else {
        if (!this.useLocalstorage) {
          $rootScope.pleaseConfirmEmail = true;
        }
      }

    });
  };

  this._doCreateProfile = function(username, password, cb) {

    $rootScope.hideNavigation = false;

    identityService.create(username, password, function(err) {
      if (err) {
        return cb(err);
      } else {
        // mobile
        if (this.isMobile) {
          $rootScope.starting = null;
          _credentials = {
            username: username,
            password: password,
          };
          this.askForPin = 1;
          this.hideForWP = 0;

          $rootScope.hideNavigation = true;
          $timeout(function() {
            $rootScope.$digest();
          }, 1);
          return;
        } else {
//          this.createDefaultWallet();
        }
      }
      return cb();
    });
  };

  this.createProfile = function(form) {
    if (form && form.$invalid) {
      this.error = 'Please enter the required fields';
      return;
    }

    $rootScope.starting = true;

    this._doCreateProfile(form.username.$modelValue, form.password.$modelValue, function(err) {
      if (err) { 
        this.error = err;
        this.passwordStrength = null;
        $rootScope.starting = false; 
      }
      form.password.$setViewValue('');
      form.password.$render();
      form.repeatpassword.$setViewValue('');
      form.repeatpassword.$render();
      form.$setPristine();
      $timeout(function() {
        $rootScope.$digest();
      }, 1);
    });
  };
});
