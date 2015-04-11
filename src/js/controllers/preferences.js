'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, configService, profileService) {
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.unitName = config.wallet.settings.unitName;
    this.bwsurl = config.bws.url;
    this.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };
    var fc = profileService.focusedClient;
    $scope.encrypt = fc.hasPrivKeyEncrypted();

    var unwatch = $scope.$watch('encrypt', function(val) {
      var fc = profileService.focusedClient;
      if (val && !fc.hasPrivKeyEncrypted()) {
        $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
          if (err || !password) {
            $scope.encrypt = false;
            return;
          }
          profileService.setPrivateKeyEncryptionFC(password, function() {
            $scope.encrypt = true;
          });
        });
      } else {
        if (!val && fc.hasPrivKeyEncrypted())  {
          profileService.unlockFC(function(err){
            if (err) {
              $scope.encrypt = true;
              return;
            }
            profileService.disablePrivateKeyEncryptionFC(function(err) {
              if (err) {
                $scope.encrypt = true;
                $log.error(err);
                return;
              }
              $scope.encrypt = false;
            });
          });
        }
      }
    });

    $scope.$on('$destroy', function() {
      unwatch();
    });
  });
