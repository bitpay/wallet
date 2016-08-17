'use strict';

angular.module('copayApp.controllers').controller('walletDetailsController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $state, $stateParams, profileService, lodash, configService, gettext, gettextCatalog, platformInfo, go, walletService) {


  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var isAndroid = platformInfo.isAndroid;
  var isChromeApp = platformInfo.isChromeApp;

  var self = this;
  $rootScope.shouldHideMenuBar = false;
  $rootScope.wpInputFocused = false;
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;
  var ret = {};

  // INIT. Global value
  ret.unitToSatoshi = walletSettings.unitToSatoshi;
  ret.satToUnit = 1 / ret.unitToSatoshi;
  ret.unitName = walletSettings.unitName;
  ret.alternativeIsoCode = walletSettings.alternativeIsoCode;
  ret.alternativeName = walletSettings.alternativeName;
  ret.alternativeAmount = 0;
  ret.unitDecimals = walletSettings.unitDecimals;
  ret.isCordova = isCordova;
  ret.addresses = [];
  ret.isMobile = platformInfo.isMobile;
  ret.isWindowsPhoneApp = platformInfo.isWP;
  ret.countDown = null;
  ret.sendMaxInfo = {};
  ret.showAlternative = false;

  $scope.openSearchModal = function() {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/search.html', {
      scope: $scope,
      focusFirstInput: true
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });
  };

  this.openTxModal = function(btx) {
    var self = this;

    $scope.btx = lodash.cloneDeep(btx);
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
      scope: $scope,
      hideDelay: 500
    }).then(function(modal) {
      $scope.txDetailsModal = modal;
      $scope.txDetailsModal.show();
    });
  };

  $scope.update = function() {
    walletService.updateStatus(wallet, {
      force: true
    }, function(err, status) {
      if (err) {} // TODO
    });
  };

  $scope.hideToggle = function() {
    console.log('[walletDetails.js.70:hideToogle:] TODO'); //TODO
  };

  if (!$stateParams.walletId) {
    $log.debug('No wallet provided... using the first one');
    $stateParams.walletId = profileService.getWallets({
      onlyComplete: true
    })[0].id;
  }


  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.wallet = wallet;

  if (wallet) {
    walletService.updateStatus(wallet, {
      triggerTxUpdate: true
    }, function(err, status) {
      console.log(status);
      if (err) {} // TODO
    });
  }
});
