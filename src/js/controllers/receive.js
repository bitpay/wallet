'use strict';

angular.module('copayApp.controllers').controller('receiveController',
  function($rootScope, $scope, $timeout, $modal, $log, isCordova, isMobile, profileService, storageService) {
    var self = this;
    var fc = profileService.focusedClient;


    this.isCordova = isCordova;
    self.addresses = [];

    var newAddrListener = $rootScope.$on('Local/NeedNewAddress', function() {
      self.getAddress();
    });
    $scope.$on('$destroy', newAddrListener);

    this.newAddress = function() {
      self.generatingAddress = true;
      fc.createAddress(function(err, addr) {
        if (err) {
          $log.debug('Creating address ERROR:', err);
          $scope.$emit('Local/ClientError', err);
        } else {
          self.addr = addr.address;
          storageService.storeLastAddress(fc.credentials.walletId, addr.address, function() {});
        }
        self.generatingAddress = false;
        $scope.$digest();
      });
    };

    this.getAddress = function() {
      $timeout(function() {
        storageService.getLastAddress(fc.credentials.walletId, function(err, addr) {
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

  }
);
