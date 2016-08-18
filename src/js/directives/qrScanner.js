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
      template: '<a on-tap="openScanner()"><i class="icon ion-qr-scanner"></i></a>'
    }
  });
