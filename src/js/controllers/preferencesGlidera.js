'use strict';

angular.module('copayApp.controllers').controller('preferencesGlideraController',
  function($scope, $log, $timeout, $state, ongoingProcess, glideraService, popupService, gettextCatalog) {

    $scope.update = function(opts) {
      if (!$scope.token || !$scope.permissions) return;
      $log.debug('Updating Glidera Account...');
      var accessToken = $scope.token;
      var permissions = $scope.permissions;

      opts = opts || {};

      glideraService.getStatus(accessToken, function(err, data) {
        $scope.status = data;
      });

      glideraService.getLimits(accessToken, function(err, limits) {
        $scope.limits = limits;
      });

      if (permissions.transaction_history) {
        glideraService.getTransactions(accessToken, function(err, data) {
          $scope.txs = data;
        });
      }

      if (permissions.view_email_address && opts.fullUpdate) {
        glideraService.getEmail(accessToken, function(err, data) {
          $scope.email = data;
        });
      }
      if (permissions.personal_info && opts.fullUpdate) {
        glideraService.getPersonalInfo(accessToken, function(err, data) {
          $scope.personalInfo = data;
        });
      }
    };

    $scope.revokeToken = function() {
      popupService.showConfirm('Glidera', 'Are you sure you would like to log out of your Glidera account?', null, null, function(res) {
        if (res) {
          glideraService.removeToken(function() {
            $timeout(function() {
              $state.go('tabs.buyandsell.glidera');
            }, 100);
          });
        }
      });
    };

    $scope.$on("$ionicView.enter", function(event, data){
      $scope.network = glideraService.getEnvironment();

      $scope.token = null;
      $scope.permissions = null;
      $scope.email = null;
      $scope.personalInfo = null;
      $scope.txs = null;
      $scope.status = null;
      $scope.limits = null;

      ongoingProcess.set('connectingGlidera', true);
      glideraService.init($scope.token, function(err, glidera) {
        ongoingProcess.set('connectingGlidera');
        if (err || !glidera) {
          if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.token = glidera.token;
        $scope.permissions = glidera.permissions;
        $scope.update({
          fullUpdate: true
        });
      });
    });

  });
