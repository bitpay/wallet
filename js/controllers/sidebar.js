'use strict';

angular.module('copayApp.controllers').controller('SidebarController', 
    function($scope, $rootScope, $sce, $location, $http, notification, controllerUtils) {

    $scope.version = copay.version;
    $scope.networkName = config.networkName;
    $scope.menu = [{
      'title': 'Addresses',
      'icon': 'fi-address-book',
      'link': 'addresses'
    }, {
      'title': 'Transactions',
      'icon': 'fi-clipboard-pencil',
      'link': 'transactions'
    }, {
      'title': 'Send',
      'icon': 'fi-arrow-right',
      'link': 'send'
    }, {
      'title': 'More',
      'icon': 'fi-download',
      'link': 'backup'
    }];

    $scope.signout = function() {
      logout();
    };

    // Ensures a graceful disconnect
    window.onbeforeunload = logout;

    $scope.$on('$destroy', function() {
      window.onbeforeunload = undefined;
    });


    $scope.refresh = function() {
      var w = $rootScope.wallet;
      w.connectToAll();
      if ($rootScope.addrInfos.length > 0) {
        controllerUtils.updateBalance(function() {
          $rootScope.$digest();
        });
      }
    };

    $scope.isActive = function(item) {
      return item.link && item.link == $location.path().split('/')[1];
    };

    function logout() {
      var w = $rootScope.wallet;
      if (w) {
        w.disconnect();
        controllerUtils.logout();
      }
    }

    // ng-repeat defined number of times instead of repeating over array?
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

  });
