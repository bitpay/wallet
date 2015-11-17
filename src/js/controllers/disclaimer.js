'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $timeout, $log, profileService, isCordova, storageService, gettextCatalog, applicationService, uxLanguage, go) {


    $scope.create = function() {
      $scope.creatingProfile = true;
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
      }
      $scope.loading = true;
      storageService.setCopayDisclaimerFlag(function(err) {
        $scope.creatingProfile = false;
        if (isCordova) {
          window.plugins.spinnerDialog.hide();
        }
        applicationService.restart();
      });
    };

    $scope.init = function(noWallet) {
      storageService.getCopayDisclaimerFlag(function(err, val) {
        $scope.lang = uxLanguage.currentLanguage;
        $scope.agreed = val;

        profileService.create({
          noWallet: noWallet
        }, function(err) {
          if (err) {
            $log.warn(err);
            $scope.error = err;
            $scope.$apply();
          }
        });
      });
    };

  });
