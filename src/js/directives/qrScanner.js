'use strict';

angular.module('copayApp.directives')
  .directive('qrScanner', function($rootScope, $timeout, $ionicModal, gettextCatalog, platformInfo) {

    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

    var controller = function($scope) {

      var onSuccess = function(result) {
        $timeout(function() {
          window.plugins.spinnerDialog.hide();
        }, 100);
        if (isWP && result.cancelled) return;

        $timeout(function() {
          var data = isIOS ? result : result.text;
          $scope.onScan({
            data: data
          });
        }, 1000);
      };

      var onError = function(error) {
        $timeout(function() {
          window.plugins.spinnerDialog.hide();
        }, 100);
      };

      $scope.cordovaOpenScanner = function() {
        window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Preparing camera...'), true);
        $timeout(function() {
          if (isIOS) {
            cloudSky.zBar.scan({}, onSuccess, onError);
          } else {
            cordova.plugins.barcodeScanner.scan(onSuccess, onError);
          }
          if ($scope.beforeScan) {
            $scope.beforeScan();
          }
        }, 100);
      };

      $scope.modalOpenScanner = function() {
        $ionicModal.fromTemplateUrl('views/modals/scanner.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.scannerModal = modal;
          $scope.scannerModal.show();
        });
      };

      $scope.openScanner = function() {
        if (isCordova) {
          $scope.cordovaOpenScanner();
        } else {
          $scope.modalOpenScanner();
        }
      };
    };

    return {
      restrict: 'E',
      scope: {
        onScan: "&",
        beforeScan: "&"
      },
      controller: controller,
      replace: true,
      template: '<a id="camera-icon" class="p10" ng-click="openScanner()"><i class="icon-scan size-21"></i></a>'
    }
  });
