'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController',
  function($scope, $timeout, $log, profileService, walletService, glideraService, bwcError, lodash, ongoingProcess, popupService, gettextCatalog) {

    var wallet;
    var self = this;
    this.show2faCodeInput = null;
    this.success = null;

    $scope.$on('Wallet/Changed', function(event, w) {
      if (lodash.isEmpty(w)) {
        $log.debug('No wallet provided');
        return;
      }
      wallet = w;
      $log.debug('Wallet changed: ' + w.name);
    });

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

    this.getBuyPrice = function(token, price) {
      var self = this;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.buyPrice = null;
        return;
      }
      this.gettingBuyPrice = true;
      glideraService.buyPrice(token, price, function(err, buyPrice) {
        self.gettingBuyPrice = false;
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get exchange information. Please, try again'));
          return;
        }
        self.buyPrice = buyPrice;
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      ongoingProcess.set('Sending 2FA code...', true);
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          ongoingProcess.set('Sending 2FA code...', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not send confirmation code to your phone'));
            return;
          }
          self.show2faCodeInput = sent;
        });
      }, 100);
    };

    this.sendRequest = function(token, permissions, twoFaCode) {
      var self = this;
      ongoingProcess.set('Buying Bitcoin...', true);
      $timeout(function() {
        walletService.getAddress(wallet, false, function(err, walletAddr) {
          if (err) {
            ongoingProcess.set('Buying Bitcoin...', false);
            popupService.showAlert(gettextCatalog.getString('Error'), bwcError.cb(err, 'Could not create address'));
            return;
          }
          var data = {
            destinationAddress: walletAddr,
            qty: self.buyPrice.qty,
            priceUuid: self.buyPrice.priceUuid,
            useCurrentPrice: false,
            ip: null
          };
          glideraService.buy(token, twoFaCode, data, function(err, data) {
            ongoingProcess.set('Buying Bitcoin...', false);
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
              return;
            }
            self.success = data;
            $timeout(function() {
              $scope.$digest();
            });
          });
        });
      }, 100);
    };

    $scope.$on("$ionicView.enter", function(event, data){
      $scope.network = glideraService.getEnvironment();

      $scope.token = accessToken;
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

      $scope.wallets = profileService.getWallets({
        network: $scope.network,
        n: 1,
        onlyComplete: true
      });
    });

  });
