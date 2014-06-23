'use strict';

angular.module('copayApp.controllers').controller('HeaderController',
  function($scope, $rootScope, $location, notification, $http, controllerUtils) {
    $scope.menu = [
    {
      'title': 'Addresses',
      'icon': 'fi-address-book',
      'link': '#/addresses'
    }, {
      'title': 'Transactions',
      'icon': 'fi-loop',
      'link': '#/transactions'
    }, {
      'title': 'Send',
      'icon': 'fi-arrow-right',
      'link': '#/send'
    }, {
      'title': 'Backup',
      'icon': 'fi-archive',
      'link': '#/backup'
    }];

    $scope.getNumber = function(num) {
      return new Array(num);
    }

    $http.get('https://api.github.com/repos/bitpay/copay/tags').success(function(data){
      var toInt = function (s) { return parseInt(s); };
      var latestVersion = data[0].name.replace('v', '').split('.').map(toInt);
      var currentVersion = copay.version.split('.').map(toInt);
      if (currentVersion[0] < latestVersion[0]){
        $scope.updateVersion = {class: 'error', version:data[0].name};
      } else if (currentVersion[0] == latestVersion[0] && currentVersion[1] < latestVersion[1]) {
        $scope.updateVersion = {class: 'info', version:data[0].name};
      } 
    });

    $rootScope.unitName = config.unitName;

    // Initialize alert notification (not show when init wallet)
    $rootScope.txAlertCount = 0;
    $rootScope.insightError = 0;

    $rootScope.$watch('insightError', function(status) {
      if (status === -1) {
        $rootScope.$flashMessage = {
          type: 'success',
          message: 'Networking Restored :)',
        };
        $rootScope.insightError = 0;
      }
    });


    // Init socket handlers (with no wallet yet)
    controllerUtils.setSocketHandlers();

    $rootScope.$watch('receivedFund', function(receivedFund) {
      if (receivedFund) {
        var currentAddr;
        for(var i=0;i<$rootScope.addrInfos.length;i++) {
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
      if (item.link && item.link.replace('#','') == $location.path()) {
        return true;
      }
      return false;
    };
    
    $scope.signout = function() {
      logout();
      $scope.clearFlashMessage();
    };

    $scope.refresh = function() {
      var w = $rootScope.wallet;
      w.connectToAll();
      if ($rootScope.addrInfos.length > 0 ) {
        controllerUtils.updateBalance(function() {
          $rootScope.$digest();
        });
      }
    };

    $scope.clearFlashMessage = function() {
      $rootScope.$flashMessage = {};
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
  });
