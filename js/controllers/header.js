'use strict';

angular.module('copayApp.controllers').controller('HeaderController',
  function($scope, $rootScope, $location, notification, $http, controllerUtils, backupService) {
    $scope.menu = [{
      'title': 'Addresses',
      'icon': 'fi-address-book',
      'link': '#/addresses'
    }, {
      'title': 'Transactions',
      'icon': 'fi-clipboard-pencil',
      'link': '#/transactions'
    }, {
      'title': 'Send',
      'icon': 'fi-arrow-right',
      'link': '#/send'
    }, {
      'title': 'Settings',
      'icon': 'fi-wrench',
      'link': '#/backup'
    }];

    $scope.getNumber = function(num) {
      return new Array(num);
    }

    $http.get('https://api.github.com/repos/bitpay/copay/tags').success(function(data) {
      var toInt = function(s) {
        return parseInt(s);
      };
      var latestVersion = data[0].name.replace('v', '').split('.').map(toInt);
      var currentVersion = copay.version.split('.').map(toInt);
      var title = 'Copay ' + data[0].name + ' available.';
      var content;
      if (currentVersion[0] < latestVersion[0]) {
        content = 'It\'s important that you update your wallet at https://copay.io';
        notification.version(title, content, true);
      } else if (currentVersion[0] == latestVersion[0] && currentVersion[1] < latestVersion[1]) {
        var content = 'Please update your wallet at https://copay.io';
        notification.version(title, content, false);
      }
    });

    $rootScope.unitName = config.unitName;

    // Initialize alert notification (not show when init wallet)
    $rootScope.txAlertCount = 0;
    $rootScope.insightError = 0;


    // Init socket handlers (with no wallet yet)
    controllerUtils.setSocketHandlers();

    $rootScope.$watch('receivedFund', function(receivedFund) {
      if (receivedFund) {
        var currentAddr;
        for (var i = 0; i < $rootScope.addrInfos.length; i++) {
          var addrinfo = $rootScope.addrInfos[i];
          if (addrinfo.address.toString() == receivedFund[1] && !addrinfo.isChange) {
            currentAddr = addrinfo.address.toString();
            break;
          }
        }
        if (currentAddr) {
          //var beep = new Audio('sound/transaction.mp3');
          notification.funds('Received fund', currentAddr, receivedFund);
          //beep.play();
        }
      }
    });

    $rootScope.$watch('txAlertCount', function(txAlertCount) {
      if (txAlertCount && txAlertCount > 0) {
        notification.info('New Transaction', ($rootScope.txAlertCount == 1) ? 'You have a pending transaction proposal' : 'You have ' + $rootScope.txAlertCount + ' pending transaction proposals', txAlertCount);
      }
    });



    $scope.isActive = function(item) {
      if (item.link && item.link.replace('#', '') == $location.path()) {
        return true;
      }
      return false;
    };

    $scope.signout = function() {
      logout();
    };

    $scope.refresh = function() {
      var w = $rootScope.wallet;
      w.connectToAll();
      if ($rootScope.addrInfos.length > 0) {
        controllerUtils.updateBalance(function() {
          $rootScope.$digest();
        });
      }
    };

    $rootScope.isCollapsed = true;

    $scope.toggleCollapse = function() {
      $rootScope.isCollapsed = !$rootScope.isCollapsed;
    };

    function logout() {
      var w = $rootScope.wallet;
      if (w) {
        w.disconnect();
        controllerUtils.logout();
      }
    }

    // Ensures a graceful disconnect
    window.onbeforeunload = logout;

    $scope.$on('$destroy', function() {
      window.onbeforeunload = undefined;
    });

    $scope.backupAndOpen = function() {
      var w = $rootScope.wallet;
      w.offerBackup();
      backupService.download(w);
    };

  });
