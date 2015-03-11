'use strict';

angular.module('copayApp.controllers').controller('signinController',
  function($rootScope, $timeout, $window, go, notification, profileService, pinService, applicationService, isMobile, isCordova, localStorageService) {

    var KEY = 'CopayDisclaimer';
    var _credentials;

    this.init = function() {
      this.isMobile = isMobile.any();
      this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
      this.hideForWP = 0;
      this.attempt = 0;
      this.digits = [];
      this.defined = [];
      this.askForPin = 0;

      // This is only for backwards compat, insight api should link to #!/confirmed directly
      if (getParam('confirmed')) {
        var hashIndex = window.location.href.indexOf('/?');
        window.location = window.location.href.substr(0, hashIndex) + '#!/confirmed';
        return;
      }

      if ($rootScope.fromEmailConfirmation) {
        this.confirmedEmail = true;
        $rootScope.fromEmailConfirmation = false;
      }

      if ($rootScope.wallet) {
        go.walletHome();
      }

    };

    this.clear = function() {
      pinService.clearPin(this);
    };

    this.press = function(digit) {
      pinService.pressPin(this, digit);
    };

    this.skip = function() {
      pinService.skipPin(this);
    };

    this.agreeDisclaimer = function() {
      if (localStorageService.set(KEY, true)) {
        this.showDisclaimer = null;
      }
    };

    this.formFocus = function() {
      if (this.isWindowsPhoneApp) {
        this.hideForWP = true;
        $timeout(function() {
          this.$digest();
        }, 1);
      }
    };

    this.openWithPin = function(pin) {

      if (!pin) {
        this.error = 'Please enter the required fields';
        return;
      }
      $rootScope.starting = true;

      $timeout(function() {
        var credentials = pinService.get(pin, function(err, credentials) {
          if (err || !credentials) {
            $rootScope.starting = null;
            this.error = 'Wrong PIN';
            this.clear();
            $timeout(function() {
              this.error = null;
            }, 2000);
            return;
          }
          this.open(credentials.email, credentials.password);
        });
      }, 100);
    };

    this.openWallets = function() {
      var iden = $rootScope.iden;
      $rootScope.hideNavigation = false;
      $rootScope.starting = true;
      iden.openWallets();
    };

    this.createPin = function(pin) {
      preconditions.checkArgument(pin);
      preconditions.checkState($rootScope.iden);
      preconditions.checkState(_credentials && _credentials.email);
      $rootScope.starting = true;

      $timeout(function() {
        pinService.save(pin, _credentials.email, _credentials.password, function(err) {
          _credentials.password = '';
          _credentials = null;
          this.askForPin = 0;
          $rootScope.hasPin = true;
          $rootScope.starting = null;
          this.openWallets();
        });
      }, 100);
    };

    this.openWithCredentials = function(form) {
      if (form && form.$invalid) {
        this.error = 'Please enter the required fields';
        return;
      }

      this.open(form.email.$modelValue, form.password.$modelValue);
    };


    this.pinLogout = function() {
      pinService.clear(function() {
        copay.logger.debug('PIN erased');
        delete $rootScope['hasPin'];
        applicationService.restart();
      });
    };

    this.open = function(username, password) {
      $rootScope.starting = true;
      profileService.open(username, password, function(err) {
        if (err) {
          $rootScope.starting = false;
          $rootScope.hasPin = false;
          pinService.clear(function() {});
          this.error = 'Unknown error';
          return;
        }

        // mobile
        if (this.isMobile && !$rootScope.hasPin) {
          _credentials = {
            email: email,
            password: password,
          };
          this.askForPin = 1;
          $rootScope.starting = false;
          $rootScope.hideNavigation = true;
          $timeout(function() {
            $rootScope.$digest();
          }, 1);
        }
        // no mobile
        else {
          //        this.openWallets();
        }
      });
    };

    function getParam(sname) {
      var params = location.search.substr(location.search.indexOf("?") + 1);
      var sval = "";
      params = params.split("&");
      // split param and value into individual pieces
      for (var i = 0; i < params.length; i++) {
        var temp = params[i].split("=");
        if ([temp[0]] == sname) {
          sval = temp[1];
        }
      }
      return sval;
    }
  });
