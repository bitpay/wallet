'use strict';

angular.module('copayApp.controllers').controller('receiveController',
  function($rootScope, $scope, $timeout, $modal, isCordova, isMobile, walletService, profileService) {

    this.showAll = false;
    this.isCordova = isCordova;

    this.newAddr = function() {
      var self = this;
      walletService.createAddress(function(err, addr) {
        self.addr = addr.address;
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
      var ModalInstanceCtrl = function(self, $modalInstance, address) {
        self.address = address;
        self.isCordova = isCordova;
        self.copyAddress = function(addr) {
          scope.copyAddress(addr);
        };

        self.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };

      $modal.open({
        templateUrl: 'views/modals/qr-address.html',
        windowClass: 'small',
        controller: ModalInstanceCtrl,
        resolve: {
          address: function() {
            return address;
          }
        }
      });
    };

    this.toggleShowAll = function() {
      this.showAll = !this.showAll;
      this.setAddressList();
    };

  }
);
