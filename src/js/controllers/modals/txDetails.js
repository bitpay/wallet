'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($scope, $rootScope, $log, $filter, profileService, configService) {

  var self = $scope.self;
  var fc = profileService.focusedClient;

  $scope.settings = configService.getSync();
  $scope.copayerId = fc.credentials.copayerId;
  $scope.isShared = fc.credentials.n > 1;

  $scope.getAlternativeAmount = function() {
    var satToBtc = 1 / 100000000;
    fc.getFiatRate({
      code: self.alternativeIsoCode,
      ts: $scope.btx.time * 1000
    }, function(err, res) {
      if (err) {
        $log.debug('Could not get historic rate');
        return;
      }
      if (res && res.rate) {
        var alternativeAmountBtc = ($scope.btx.amount * satToBtc).toFixed(8);
        $scope.rateDate = res.fetchedOn;
        $scope.rateStr = res.rate + ' ' + self.alternativeIsoCode;
        $scope.alternativeAmountStr = $filter('noFractionNumber')(alternativeAmountBtc * res.rate, 2) + ' ' + self.alternativeIsoCode;
        $scope.$apply();
      }
    });
  };

  $scope.getAmount = function(amount) {
    return self.getAmount(amount);
  };

  $scope.getUnitName = function() {
    return self.getUnitName();
  };

  $scope.getShortNetworkName = function() {
    var n = fc.credentials.network;
    return n.substring(0, 4);
  };

  $scope.copyToClipboard = function(addr) {
    if (!addr) return;
    self.copyToClipboard(addr);
  };

  $scope.cancel = function() {
    $scope.txDetailsModal.hide();
  };
});
