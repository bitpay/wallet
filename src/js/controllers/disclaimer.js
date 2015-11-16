'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $timeout, $log, profileService, isCordova, storageService, gettextCatalog, uxLanguage, go) {

    $scope.create = function(noWallet) {
      $scope.creatingProfile = true;
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
      }
      $scope.loading = true;
      $timeout(function() {
        storageService.setCopayDisclaimerFlag(function(err) {
          if (isCordova) {
            window.plugins.spinnerDialog.hide();
          }
          profileService.create({
            noWallet: noWallet
          }, function(err) {
            if (err) {
              $scope.creatingProfile = false;
              $log.warn(err);
              $scope.error = err;
              $scope.$apply();
              $timeout(function() {
                $scope.create(noWallet);
              }, 3000);
            }
          });
        });
      }, 100);
    };

    $scope.init = function() {
      storageService.getCopayDisclaimerFlag(function(err, val) {
        $scope.lang = uxLanguage.currentLanguage;
        $scope.agreed = val;

        if (profileService.profile) {
          go.walletHome();
        }
        $timeout(function() {
          $scope.$digest();
        }, 1);
      });
    };
  });
