'use strict';

angular.module('copayApp.directives')
    .directive('qrScanner', ['$rootScope', '$timeout', '$ionicModal', 'isCordova', 'gettextCatalog',
      function($rootScope, $timeout, $ionicModal, isCordova, gettextCatalog) {

        var controller = function($scope) {

          $scope.cordovaOpenScanner = function() {
            window.ignoreMobilePause = true;
            window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Preparing camera...'), true);
            $timeout(function() {
              cordova.plugins.barcodeScanner.scan(
                  function onSuccess(result) {
                    $timeout(function() {
                      window.plugins.spinnerDialog.hide();
                      window.ignoreMobilePause = false;
                    }, 100);
                    if (result.cancelled) return;

                    $timeout(function() {
                      var data = result.text;
                      $scope.onScan({ data: data });
                    }, 1000);
                  },
                  function onError(error) {
                    $timeout(function() {
                      window.ignoreMobilePause = false;
                      window.plugins.spinnerDialog.hide();
                    }, 100);
                    alert('Scanning error');
                  }
              );
              if ($scope.beforeScan) {
                $scope.beforeScan();
              }
            }, 100);
          };

          $scope.modalOpenScanner = function() {
            $ionicModal.fromTemplateUrl('views/modals/scanner.html', {
              scope: $scope,
              backdropClickToClose: false,
              hardwareBackButtonClose: false,
              animation: 'slide-in-up'
            }).then(function(modal) {
              $scope.scannerModal = modal;
              $scope.scannerModal.show();
            });
          };

          $scope.openScanner = function() {
            if (isCordova) {
              $scope.cordovaOpenScanner();
            }
            else {
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
          link: function ($scope, $element, $attributes) {
            $scope.skin = $rootScope.skin;
          },
          controller: controller,
          replace: true,
          template: '<div id="camera-icon" class="p10" ng-click="openScanner()"><i class="icon-scan size-21"></i></div>'
        }
      }
    ]);
