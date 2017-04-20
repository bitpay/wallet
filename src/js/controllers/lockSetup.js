'use strict';

angular.module('copayApp.controllers').controller('lockSetupController', function($state, $scope, $timeout, $log, configService, gettextCatalog, fingerprintService, profileService, lodash) {

  function init() {
    $scope.options = [
      {
        method: null,
        label: gettextCatalog.getString('Disabled'),
      },
      {
        method: 'pin',
        label: gettextCatalog.getString('Lock by PIN'),
        needsBackup: null,
        disabled: null,
      },
    ];

    if (fingerprintService.isAvailable()) {
      $scope.options.push({
        method: 'fingerprint',
        label: gettextCatalog.getString('Lock by Fingerprint'),
        needsBackup: null,
        disabled: null,
      });
    }

    checkAndSelectOption();
    processWallets();
  };

  $scope.$on("$ionicView.beforeEnter", function(event) {
    init();
  });

  function checkAndSelectOption() {
    var config = configService.getSync();
    var method = config.lock && config.lock.method;

    if (!method) {
      $scope.currentOption = $scope.options[0];
      $scope.options[1].disabled = false;
      $scope.options[2].disabled = false;
    } else {
      if (method == 'fingerprint') $scope.options[1].disabled = true;
      if (method == 'pin') $scope.options[2].disabled = true;
      $scope.currentOption = lodash.find($scope.options, {
        'method': method
      });
    }
    $timeout(function() {
      $scope.$apply();
    });
  };

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

  $scope.select = function(selectedMethod) {
    var config = configService.getSync();
    var savedMethod = config.lock && config.lock.method;

    if (!selectedMethod) {
      if (!savedMethod) return;
      if (savedMethod == 'pin') $state.transitionTo('tabs.pin', {
        fromSettings: true,
        locking: false,
      });
      else saveConfig();
    } else if (selectedMethod == 'pin') {
      if (savedMethod == 'pin') return;
      $state.transitionTo('tabs.pin', {
        fromSettings: true,
        locking: savedMethod == 'pin' ? false : true
      });
    } else if (selectedMethod == 'fingerprint') {
      if (savedMethod == 'fingerprint') return;
      else saveConfig('fingerprint');
    }
    $timeout(function() {
      $scope.$apply();
    });
  };

  function saveConfig(method) {
    var opts = {
      lock: {
        method: method || null,
        value: null,
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      checkAndSelectOption();
    });
  };
});
