'use strict';

angular.module('copayApp.controllers').controller('lockController', function($state, $scope, $timeout, $log, configService, popupService, gettextCatalog, appConfigService, fingerprintService, profileService, lodash) {

  function init() {
    var config = configService.getSync();
    $scope.locking = config.lock.method != 'pin';

    $scope.options = [
      {
        method: 'none',
        label: gettextCatalog.getString('Disabled'),
        value: config.lock.method == '',
      },
      {
        method: 'pin',
        label: gettextCatalog.getString('Enable PIN'),
        value: config.lock.method == 'pin',
        needsBackup: null,
      },
    ];

    if (fingerprintService.isAvailable()) {
      $scope.options.push({
        method: 'fingerprint',
        label: gettextCatalog.getString('Enable Fingerprint'),
        value: config.lock.method == 'fingerprint',
        needsBackup: null,
      });
    }

    $scope.currentOption = lodash.find($scope.options, 'value');
    processWallets();
  };

  $scope.$on("$ionicView.beforeEnter", function(event) {
    init();
  });

  function processWallets() {
    var wallets = profileService.getWallets();
    var singleLivenetWallet = wallets.length == 1 && wallets[0].network == 'livenet' && wallets[0].needsBackup;
    var atLeastOneLivenetWallet = lodash.any(wallets, function(w) {
      return w.network == 'livenet' && w.needsBackup;
    });

    if (singleLivenetWallet) {
      $scope.errorMsg = gettextCatalog.getString('Backup your wallet before using this function');
      disableOptsUntilBackup();
    } else if (atLeastOneLivenetWallet) {
      $scope.errorMsg = gettextCatalog.getString('Backup all livenet wallets before using this function');
      disableOptsUntilBackup();
    } else {
      enableOptsAfterBackup();
      $scope.errorMsg = null;
    }

    function enableOptsAfterBackup() {
      $scope.options[1].needsBackup = false;
      if ($scope.options[2]) $scope.options[2].needsBackup = false;
    };

    function disableOptsUntilBackup() {
      $scope.options[1].needsBackup = true;
      if ($scope.options[2]) $scope.options[2].needsBackup = true;
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.select = function(method) {
    if (method == 'none')
      saveConfig();
    else if (method == 'fingerprint') {
      var config = configService.getSync();
      if (config.lock.method == 'pin') {
        askForDisablePin(function(disablePin) {
          if (disablePin) saveConfig('fingerprint');
          else init();
        });
      } else saveConfig('fingerprint');
    } else if (method == 'pin') {
      $state.transitionTo('tabs.lock.pin', {
        fromSettings: true,
        locking: $scope.locking
      });
    }
    $timeout(function() {
      $scope.$apply();
    });
  };

  function askForDisablePin(cb) {
    var message = gettextCatalog.getString('{{appName}} is protected by Pin. Are you sure you want to disable it?', {
      appName: appConfigService.nameCase
    });
    var okText = gettextCatalog.getString('Continue');
    var cancelText = gettextCatalog.getString('Cancel');
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return cb(false);
      return cb(true);
    });
  };

  function saveConfig(method) {
    var opts = {
      lock: {
        method: method || '',
        value: '',
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };
});
