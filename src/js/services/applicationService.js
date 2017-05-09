'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, $ionicHistory, $ionicModal, platformInfo, $state) {
    var root = {};

    root.successfullUnlocked = false;
    root.pinIsOpen = false;

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

    root.pinModal = function(action) {

      root.pinIsOpen = true;
      root.successfullUnlocked = false;
      var scope = $rootScope.$new(true);
      console.log(action);
      console.log("###########################111");
      scope.action = action;
      $ionicModal.fromTemplateUrl('views/modals/pin.html', {
        scope: scope,
        animation: 'slide-in-up',
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
        scope.pinModal.hide();
      };
      // Cleanup the modal when we're done with it!
      scope.$on('$destroy', function() {
        scope.modal.remove();
      });
      // Execute action on hide modal
      scope.$on('modal.hidden', function() {
        // Execute action
      });
      // Execute action on remove modal
      scope.$on('modal.removed', function() {
        // Execute action
      });
    }
    return root;
  });
