'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController',
  function($scope, $timeout, $log, $ionicModal, profileService, walletService, glideraService, bwcError, lodash, ongoingProcess) {

    var wallet;
    var self = this;
    this.show2faCodeInput = null;
    this.error = null;
    this.success = null;

    $scope.init = function(accessToken) {
      $scope.network = glideraService.getEnvironment();

      $scope.token = accessToken;
      $scope.error = null;
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
          $scope.error = err;
          return;
        }
        $scope.token = glidera.token;
        $scope.permissions = glidera.permissions;
        $scope.update({fullUpdate: true});
      });

      self.allWallets = profileService.getWallets({
        network: $scope.network,
        n: 1,
        onlyComplete: true
      });
      if (lodash.isEmpty(self.allWallets)) return;

      wallet = self.allWallets[0];
      if (wallet) {
        $timeout(function() {
          self.selectedWalletId = wallet.credentials.walletId;
          self.selectedWalletName = wallet.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
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

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'BUY';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          wallet = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = wallet.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.getBuyPrice = function(token, price) {
      var self = this;
      this.error = null;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.buyPrice = null;
        return;
      }
      this.gettingBuyPrice = true;
      glideraService.buyPrice(token, price, function(err, buyPrice) {
        self.gettingBuyPrice = false;
        if (err) {
          self.error = 'Could not get exchange information. Please, try again.';
          return;
        }
        self.buyPrice = buyPrice;
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      self.error = null;
      ongoingProcess.set('Sending 2FA code...', true);
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          ongoingProcess.set('Sending 2FA code...', false);
          if (err) {
            self.error = 'Could not send confirmation code to your phone';
            return;
          }
          self.show2faCodeInput = sent;
        });
      }, 100);
    };

    this.sendRequest = function(token, permissions, twoFaCode) {
      var self = this;
      self.error = null;
      ongoingProcess.set('Buying Bitcoin...', true);
      $timeout(function() {
        walletService.getAddress(wallet, false, function(err, walletAddr) {
          if (err) {
            ongoingProcess.set('Buying Bitcoin...', false);
            self.error = bwcError.cb(err, 'Could not create address');
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
              self.error = err;
              return;
            }
            self.success = data;
            $scope.$emit('Local/GlideraTx');
          });
        });
      }, 100);
    };

  });
