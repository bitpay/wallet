'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, $ionicHistory, $ionicModal, platformInfo, fingerprintService, openURLService, configService, $state) {
    var root = {};

    var isChromeApp = platformInfo.isChromeApp;
    var isNW = platformInfo.isNW;

    root.restart = function() {
      var hashIndex = window.location.href.indexOf('#/');
      if (platformInfo.isCordova) {
        window.location = window.location.href.substr(0, hashIndex);
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        if (isChromeApp) {
          chrome.runtime.reload();
        } else if (isNW) {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
          $timeout(function() {
            var win = require('nw.gui').Window.get();
            win.reload(3);
            //or
            win.reloadDev();
          }, 100);
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    root.fingerprintModal = function() {
      fingerprintService.check('unlockingApp', function(err) {
        if (err) {
          root.fingerprintModal();
          return;
        }
      });
    };

    root.pinModal = function(action) {

      var scope = $rootScope.$new(true);
      scope.action = action;
      $ionicModal.fromTemplateUrl('views/modals/pin.html', {
        scope: scope,
        animation: 'none',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        scope.pinModal = modal;
        scope.openModal();
      });
      scope.openModal = function() {
        scope.pinModal.show();
      };
      scope.hideModal = function() {
        scope.$emit('pinModalClosed');
        scope.pinModal.hide();
      };
    };

    root.appLockModal = function(action) {

      configService.whenAvailable(function(config) {
        var lockMethod = config.lock && config.lock.method;
        if (!lockMethod || lockMethod == 'none') return;

        if (lockMethod == 'fingerprint' && fingerprintService.isAvailable()) root.fingerprintModal();
        if (lockMethod == 'pin') root.pinModal(action);

      });
    }
    return root;
  });
