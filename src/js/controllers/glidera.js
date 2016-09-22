'use strict';

angular.module('copayApp.controllers').controller('glideraController',
  function($scope, $timeout, $ionicModal, $log, storageService, glideraService, ongoingProcess, platformInfo, externalLinkService, popupService, gettextCatalog) {

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };

    var initGlidera = function(accessToken) {
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
        $scope.update({fullUpdate: true});
      });
    };

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
          $scope.email = data.email;
        });
      }
      if (permissions.personal_info && opts.fullUpdate) {
        glideraService.getPersonalInfo(accessToken, function(err, data) {
          $scope.personalInfo = data;
        });
      }
    };

    this.getAuthenticateUrl = function() {
      return glideraService.getOauthCodeUrl();
    };

    this.submitOauthCode = function(code) {
      ongoingProcess.set('connectingGlidera', true);
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingGlidera', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
          } else if (data && data.access_token) {
            storageService.setGlideraToken($scope.network, data.access_token, function() {
              initGlidera(data.access_token);
              $timeout(function() {
                $scope.$apply();
              }, 100);
            });
          }
        });
      }, 100);
    };

    this.openTxModal = function(token, tx) {
      var self = this;

      $scope.self = self;
      $scope.tx = tx;

      glideraService.getTransaction(token, tx.transactionUuid, function(err, tx) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get transactions'));
          return;
        }
        $scope.tx = tx;
      });

      $ionicModal.fromTemplateUrl('views/modals/glidera-tx-details.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.glideraTxDetailsModal = modal;
        $scope.glideraTxDetailsModal.show();
      });
    };

    $scope.$on("$ionicView.enter", function(event, data){
      initGlidera();
    });

  });
