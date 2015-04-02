'use strict';

angular.module('copayApp.controllers').controller('receiveController',
  function($rootScope, $scope, $timeout, $modal, $log, isCordova, isMobile, profileService, storageService) {
    var self = this;
    var fc = profileService.focusedClient;

    this.showAll = false;
    this.isCordova = isCordova;
    self.addresses = [];

    this.newAddress = function() {
      self.generatingAddress = true;
      fc.createAddress(function(err, addr) {
        if (err) {
          $log.debug('Creating address ERROR:', err);
        }
        else {
          self.addr = addr.address;
          storageService.storeLastAddress(fc.walletId, addr.address, function() {});
        }
        self.generatingAddress = false;
        $scope.$emit('Local/ClientError', err);
      });
    };

    this.getAddress = function() {
      $timeout(function() {
        storageService.getLastAddress(fc.walletId, function(err, addr) {
          if (addr) {
            self.addr = addr;
          } else {
            self.newAddress();
          }
        });
      });
    };

    this.copyAddress = function(addr) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy('bitcoin:' + addr);
        window.plugins.toast.showShortCenter('Copied to clipboard');
      }
    };

    this.shareAddress = function(addr) {
      if (isCordova) {
        if (isMobile.Android() || isMobile.Windows()) {
          window.ignoreMobilePause = true;
        }
        window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
      }
    };

    this.openAddressModal = function(address) {
      var self = this;
      var ModalInstanceCtrl = function($scope, $modalInstance, address) {
        $scope.address = address;
        $scope.isCordova = self.isCordova;
        $scope.copyAddress = function(addr) {
          self.copyAddress(addr);
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };

      $modal.open({
        templateUrl: 'views/modals/qr-address.html',
        windowClass: 'full',
        controller: ModalInstanceCtrl,
        resolve: {
          address: function() {
            return address;
          }
        }
      });
    };

    this.toggleShowAll = function() {
      this.setAddressList();
    };

    this.setAddressList = function() {
      var self = this;
      self.loadingAddresses = true;
      $timeout(function() {
        if (!self.addresses[0]) {
          fc.getMainAddresses({}, function(err, addrs) {
            if (err) {
              $log.debug('Getting addresses ERROR:', err);
            }
            else {
              self.addresses = addrs;
            }
            self.loadingAddresses = false;
            $scope.$emit('Local/ClientError', err);
          });
        } else {
          self.loadingAddresses = false;
          self.addresses = [];
        }
      }, 10);
    };

  }
);
