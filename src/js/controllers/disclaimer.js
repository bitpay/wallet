'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $timeout, storageService, applicationService, gettextCatalog, isCordova, uxLanguage) {

    $scope.agree = function() {
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
      }
      $scope.loading = true;
      $timeout(function() {
        storageService.setCopayDisclaimerFlag(function(err) {
          $timeout(function() {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            applicationService.restart();
          }, 1000);
        });
      }, 100);
    };
    
    $scope.init = function() {
      storageService.getCopayDisclaimerFlag(function(err, val) {
        $scope.lang = uxLanguage.currentLanguage;
        $scope.agreed = val;
        $timeout(function() {
          $scope.$digest();
        }, 1);
      });
    };
  });
