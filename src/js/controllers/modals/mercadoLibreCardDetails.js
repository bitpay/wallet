'use strict';

angular.module('copayApp.controllers').controller('mercadoLibreCardDetailsController', function($scope, mercadoLibreService, externalLinkService, appConfigService, gettextCatalog) {

  $scope.remove = function() {
    mercadoLibreService.savePendingGiftCard($scope.card, {
      remove: true
    }, function(err) {
      $scope.close();
    });
  };

  $scope.close = function() {
    $scope.mercadoLibreCardDetailsModal.hide();
  };

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
  };

  $scope.openSupportWebsite = function() {
    var appName = appConfigService.name;
    var url = appName == 'copay' ? 'https://github.com/bitpay/copay/issues/new' : 'https://help.bitpay.com/requestHelp';
    var optIn = true;
    var title = null;
    var message = gettextCatalog.getString('Help and support information is available at the website.');
    var okText = gettextCatalog.getString('Open');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

});
