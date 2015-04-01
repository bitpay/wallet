'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $filter, $timeout, $modal, balanceService, notification, backupService, profileService, configService, isMobile, isCordova, go, rateService, applicationService, bwcService) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.hideAdv = true;
    this.hidePriv = true;
    this.hideSecret = true;
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.unitName = config.wallet.settings.unitName;
  this.bwsurl = config.bws.url;

    this.unitOpts = [{
      name: 'Satoshis (100,000,000 satoshis = 1BTC)',
      shortName: 'SAT',
      value: 1,
      decimals: 0
    }, {
      name: 'bits (1,000,000 bits = 1BTC)',
      shortName: 'bits',
      value: 100,
      decimals: 2
    }, {
      name: 'mBTC (1,000 mBTC = 1BTC)',
      shortName: 'mBTC',
      value: 100000,
      decimals: 5
    }, {
      name: 'BTC',
      shortName: 'BTC',
      value: 100000000,
      decimals: 8
    }];

    for (var ii in this.unitOpts) {
      if (this.unitName === this.unitOpts[ii].shortName) {
        this.selectedUnit = this.unitOpts[ii];
        break;
      }
    }

    this.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };
    this.alternativeOpts = rateService.isAvailable() ?
      rateService.listAlternatives() : [this.selectedAlternative];


    var self = this;
    rateService.whenAvailable(function() {
      self.alternativeOpts = rateService.listAlternatives();
      for (var ii in self.alternativeOpts) {
        if (config.wallet.settings.alternativeIsoCode === self.alternativeOpts[ii].isoCode) {
          self.selectedAlternative = self.alternativeOpts[ii];
        }
      }
      $scope.$digest();
    });



    this.save = function() {
      var opts = {
        wallet: {
          settings: {
            unitName: this.selectedUnit.shortName,
            unitToSatoshi: this.selectedUnit.value,
            unitDecimals: this.selectedUnit.decimals,
            alternativeName: this.selectedAlternative.name,
            alternativeIsoCode: this.selectedAlternative.isoCode,
          }
        },
        bws: {
          url: this.bwsurl,
        }
      };

      configService.set(opts, function(err) {
        if (err) console.log(err);
        applicationService.restart();
        go.walletHome();
        $scope.$emit('Local/ConfigurationUpdated');
        notification.success('Success', $filter('translate')('settings successfully updated'));
      });



      // notification.success('Success', $filter('translate')('settings successfully updated'));
      // balanceService.update(w, function() {
      //   pendingTxsService.update();
      //   $rootScope.$digest();
      // });
    };

    var _modalDeleteWallet = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.title = 'Are you sure you want to delete this wallet?';
        $scope.loading = false;

        $scope.ok = function() {
          $scope.loading = true;
          $modalInstance.close('ok');

        };
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: 'full',
        controller: ModalInstanceCtrl
      });
      modalInstance.result.then(function(ok) {
        console.log('[preferences.js:82]', ok); //TODO
      });
    };

    var _deleteWallet = function() {
      this.loading = true;
      $timeout(function() {
        profileService.deleteWallet(w, function(err) {
          this.loading = false;
          if (err) {
            this.error = err.message || err;
            copay.logger.warn(err);
            $timeout(function() {
              $scope.$digest();
            });
          } else {
            go.walletHome();
            $timeout(function() {
              notification.success('Success', 'The wallet "' + (w.name || w.id) + '" was deleted');
            });
          }
        });
      }, 100);
    };

    this.deleteWallet = function() {
      if (isCordova) {
        navigator.notification.confirm(
          'Are you sure you want to delete this wallet?',
          function(buttonIndex) {
            console.log('[preferences.js:67]', buttonIndex); //TODO
            if (buttonIndex == 2) {
              _deleteWallet();
            }
          },
          'Confirm', ['Cancel', 'OK']
        );
      } else {
        _modalDeleteWallet();
      }
    };

    this.copyText = function(text) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(text);
        window.plugins.toast.showShortCenter('Copied to clipboard');
      }
    };

    this.downloadWalletBackup = function() {
      backupService.walletDownload();
    };

    this.viewWalletBackup = function() {
      var self = this;
      this.loading = true;
      $timeout(function() {
        self.backupWalletPlainText = backupService.walletExport();
      }, 100);
    };

    this.copyWalletBackup = function() {
      var ew = backupService.walletExport();
      window.cordova.plugins.clipboard.copy(ew);
      window.plugins.toast.showShortCenter('Copied to clipboard');
    };

    this.sendWalletBackup = function() {
      var fc = profileService.focusedClient;
      if (isMobile.Android() || isMobile.Windows()) {
        window.ignoreMobilePause = true;
      }
      window.plugins.toast.showShortCenter('Preparing backup...');
      var name = (fc.walletName || fc.walletId);
      var ew = backupService.walletExport();
      var properties = {
        subject: 'Copay Wallet Backup: ' + name,
        body: 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}',
        isHtml: false
      };
      window.plugin.email.open(properties);
    };

  });
