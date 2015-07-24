'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, notification, profileService, isCordova, go, gettext, gettextCatalog) {
    this.isCordova = isCordova;
    this.error = null;

    var _modalDeleteWallet = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance, gettext) {
        $scope.title = gettext('Are you sure you want to delete this wallet?');
        $scope.loading = false;

        $scope.ok = function() {
          $scope.loading = true;
          $modalInstance.close(gettext('OK'));

        };
        $scope.cancel = function() {
          $modalInstance.dismiss(gettext('Cancel'));
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: 'full',
        controller: ModalInstanceCtrl
      });
      modalInstance.result.then(function(ok) {
        if (ok) {
          _deleteWallet();
        }
      });
    };

    var _deleteWallet = function() {
      var fc = profileService.focusedClient;
      var name = fc.credentials.walletName;
      var walletName = (fc.alias||'') + ' [' + name + ']';
      var self = this;

      profileService.deleteWalletFC({}, function(err) {
        if (err) {
          self.error = err.message || err;
        } else {
          notification.success(gettext('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {walletName: walletName}));
        }
      });
    };

    this.deleteWallet = function() {
      if (isCordova) {
        navigator.notification.confirm(
          gettext('Are you sure you want to delete this wallet?'),
          function(buttonIndex) {
            if (buttonIndex == 2) {
              _deleteWallet();
            }
          },
          gettext('Confirm'), [gettext('Cancel'), gettext('OK')]
        );
      } else {
        _modalDeleteWallet();
      }
    };
  });
