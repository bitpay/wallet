'use strict';
angular.module('copayApp.controllers').controller('glideraUriController',
  function($scope, $log, $stateParams, $timeout, glideraService, storageService, $state, ongoingProcess, popupService, gettextCatalog) {

    var submitOauthCode = function(code) {
      $log.debug('Glidera Oauth Code:' + code);
      $scope.network = glideraService.getEnvironment();
      ongoingProcess.set('connectingGlidera', true);
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingGlidera', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
          } else if (data && data.access_token) {
            storageService.setGlideraToken($scope.network, data.access_token, function() {
              $timeout(function() {
                $state.go('glidera.main');
                $scope.$apply();
              }, 500);
            });
          }
        });
      }, 100);
    };

    $scope.checkCode = function() {
      if ($stateParams.url) {
        var match = $stateParams.url.match(/code=(.+)/);
        if (match && match[1]) {
          submitOauthCode(match[1]);
          return;
        }
      }
      $log.error('Bad state: ' + JSON.stringify($stateParams));
    }
  });
