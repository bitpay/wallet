'use strict';

angular.module('copayApp.directives')
  .directive('qrScanner', function($state, $rootScope, $log) {

    return {
      restrict: 'E',
      scope: {
        onScan: "&"
      },
      replace: true,
      template: '<a on-tap="openScanner()"><i class="icon ion-qr-scanner"></i></a>',
      link: function(scope, el, attrs) {

        scope.openScanner = function() {
          $log.debug('Opening scanner by directive...');
          $state.go('scanner', { passthroughMode: 1 });
        };

        $rootScope.$on('$ionicView.afterEnter', function() {
          if($rootScope.scanResult) {
            scope.onScan({ data: $rootScope.scanResult });
            $rootScope.scanResult = null;
          }
        });
      }
    }
  });
