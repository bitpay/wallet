'use strict';

angular.module('copayApp.controllers').controller('preferencesGlideraController', 
  function($scope, $modal, $timeout, profileService, applicationService, glideraService, storageService, isChromeApp) {

    this.getEmail = function(token) {
      var self = this;
      glideraService.getEmail(token, function(error, data) {
        self.email = data;
      });
    };

    this.getPersonalInfo = function(token) {
      var self = this;
      glideraService.getPersonalInfo(token, function(error, info) {
        self.personalInfo = info;
      });
    };

    this.getStatus = function(token) {
      var self = this;
      glideraService.getStatus(token, function(error, data) {
        self.status = data;
      });
    };

    this.getLimits = function(token) {
      var self = this;
      glideraService.getLimits(token, function(error, limits) {
        self.limits = limits;
      });
    };

    // DISABLE ANIMATION ON CHROMEAPP
    if (isChromeApp) {
      var animatedSlideRight = 'full';
    }
    else {
      var animatedSlideRight = 'full animated slideInRight';
    }

    this.revokeToken = function() {
      var fc = profileService.focusedClient;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.ok = function() {
          $modalInstance.close(true);
        };
        $scope.cancel = function() {
          $modalInstance.dismiss();
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/glidera-confirmation.html',
        windowClass: animatedSlideRight,
        controller: ModalInstanceCtrl
      });

      modalInstance.result.then(function(ok) {
        if (ok) {
          storageService.removeGlideraToken(fc.credentials.network, function() {
            $timeout(function() {
              applicationService.restart();
            }, 100);
          });
        }
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass('slideOutRight');
      });
    };

  });
