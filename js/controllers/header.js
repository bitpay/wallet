'use strict';

angular.module('copayApp.controllers').controller('HeaderController',
  function($scope, $rootScope, $location, notification, $http, $sce, controllerUtils, backupService) {
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
      'title': 'More...',
      'icon': 'fi-download',
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


    // Init socket handlers (with no wallet yet)
    controllerUtils.setSocketHandlers();

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

    $scope.backup = function() {
      var w = $rootScope.wallet;
      w.setBackupReady();
      backupService.download(w);
    };

    $scope.getVideoURL = function(copayer) {
      if (config.disableVideo) return;

      var vi = $rootScope.videoInfo[copayer]
      if (!vi) return;

      if ($rootScope.wallet.getOnlinePeerIDs().indexOf(copayer) === -1) {
        // peer disconnected, remove his video
        delete $rootScope.videoInfo[copayer]
        return;
      }

      var encoded = vi.url;
      var url = decodeURI(encoded);
      var trusted = $sce.trustAsResourceUrl(url);
      return trusted;
    };

  });
