'use strict';

angular.module('copayApp.directives')
  .directive('qrScanner', function($state, $rootScope, $log, $ionicHistory, platformInfo, scannerService, popupService) {

    return {
      restrict: 'E',
      scope: {
        onScan: "&"
      },
      replace: true,
      template: '<a on-tap="chooseScanner()" nav-transition="none"><i class="icon ion-qr-scanner"></i></a>',
      link: function(scope, el, attrs) {

        scope.chooseScanner = function() {
          var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

          if (!isWindowsPhoneApp) {
            scope.openScanner();
            return;
          }

          scannerService.useOldScanner(function(err, contents) {
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
              return;
            }
            scope.onScan({
              data: contents
            });
          });
        };

        scope.openScanner = function() {
          $log.debug('Opening scanner by directive...');
          $ionicHistory.nextViewOptions({
            disableAnimate: true
          });
          $state.go('scanner', {
            passthroughMode: 1
          });
        };

        var afterEnter = $rootScope.$on('$ionicView.afterEnter', function() {
          if ($rootScope.scanResult) {
            scope.onScan({
              data: $rootScope.scanResult
            });
            $rootScope.scanResult = null;
          }
        });

        // Destroy event
        scope.$on('$destroy', function() {
          afterEnter();
        });
      }
    }
  });
