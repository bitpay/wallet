'use strict';

angular.module('copayApp.services').factory('txpModalService', function(configService, $rootScope, $ionicModal) {

  var root = {};


  var glideraActive = true; // TODO TODO TODO
  // isGlidera flag is a security measure so glidera status is not
  // only determined by the tx.message


  root.open = function(tx) {
    var config = configService.getSync().wallet;
    var scope = $rootScope.$new(true);
    scope.tx = tx;
    scope.wallet = tx.wallet;
    scope.copayers = tx.wallet.copayers;
    scope.isGlidera = glideraActive;
    scope.currentSpendUnconfirmed = config.spendUnconfirmed;

    $ionicModal.fromTemplateUrl('views/modals/txp-details.html', {
      scope: scope
    }).then(function(modal) {
      scope.txpDetailsModal = modal;
      scope.txpDetailsModal.show();
    });
  };

  return root;
});
