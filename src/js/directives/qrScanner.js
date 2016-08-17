'use strict';

angular.module('copayApp.directives')
  .directive('qrScanner', function() {

    return {
      restrict: 'E',
      scope: {
        onScan: "&",
        beforeScan: "&"
      },
      controller: 'tabScanController',
      replace: true,
      template: '<a ng-click="openScanner()"><i class="icon ion-qr-scanner"></i></a>'
    }
  });
