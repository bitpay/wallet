'use strict';

angular.module('copayApp.directives')
    .directive('qrScanner', ['$rootScope', '$timeout', '$modal', 'isCordova', 'gettextCatalog', 'isMobile', 
      function($rootScope, $timeout, $modal, isCordova, gettextCatalog, isMobile) {

        var controller = function($scope) {

          var onSuccess = function(result) {
            $timeout(function() {
              window.plugins.spinnerDialog.hide();
              window.ignoreMobilePause = false;
            }, 100);
            if (isMobile.Windows() && result.cancelled) return;

            $timeout(function() {
              var data = isMobile.iOS() ? result : result.text;
              $scope.onScan({ data: data });
            }, 1000);
          };

          var onError = function(error) {
            $timeout(function() {
              window.ignoreMobilePause = false;
              window.plugins.spinnerDialog.hide();
            }, 100);
          };

          $scope.cordovaOpenScanner = function() {
            window.ignoreMobilePause = true;
            window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Preparing camera...'), true);
            $timeout(function() {
              if (isMobile.iOS()) {
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
            var parentScope = $scope;
            var ModalInstanceCtrl = function($scope, $rootScope, $modalInstance) {
              // QR code Scanner
              var video;
              var canvas;
              var $video;
              var context;
              var localMediaStream;
              var prevResult;

              var _scan = function(evt) {
                if (localMediaStream) {
                  context.drawImage(video, 0, 0, 300, 225);
                  try {
                    qrcode.decode();
                  } catch (e) {
                    //qrcodeError(e);
                  }
                }
                $timeout(_scan, 800);
              };

              var _scanStop = function() {
                if (localMediaStream && localMediaStream.active) {
                  var localMediaStreamTrack = localMediaStream.getTracks();
                  for (var i = 0; i < localMediaStreamTrack.length; i++) {
                    localMediaStreamTrack[i].stop();
                  }
                } else {
                  try {
                    localMediaStream.stop();
                  } catch(e) {
                    // Older Chromium not support the STOP function
                  };
                }
                localMediaStream = null;
                video.src = '';
              };

              qrcode.callback = function(data) {
                if (prevResult != data) {
                  prevResult = data;
                  return;
                }
                _scanStop();
                $modalInstance.close(data);
              };

              var _successCallback = function(stream) {
                video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
                localMediaStream = stream;
                video.play();
                $timeout(_scan, 1000);
              };

              var _videoError = function(err) {
                $scope.cancel();
              };

              var setScanner = function() {
                navigator.getUserMedia = navigator.getUserMedia ||
                    navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia;
                window.URL = window.URL || window.webkitURL ||
                    window.mozURL || window.msURL;
              };

              $scope.init = function() {
                setScanner();
                $timeout(function() {
                  if (parentScope.beforeScan) {
                    parentScope.beforeScan();
                  }
                  canvas = document.getElementById('qr-canvas');
                  context = canvas.getContext('2d');


                  video = document.getElementById('qrcode-scanner-video');
                  $video = angular.element(video);
                  canvas.width = 300;
                  canvas.height = 225;
                  context.clearRect(0, 0, 300, 225);

                  navigator.getUserMedia({
                    video: true
                  }, _successCallback, _videoError);
                }, 500);
              };

              $scope.cancel = function() {
                _scanStop();
                $modalInstance.dismiss('cancel');
              };
            };

            var modalInstance = $modal.open({
              templateUrl: 'views/modals/scanner.html',
              windowClass: 'full',
              controller: ModalInstanceCtrl,
              backdrop : 'static',
              keyboard: false
            });
            modalInstance.result.then(function(data) {
              parentScope.onScan({ data: data });
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
          controller: controller,
          replace: true,
          template: '<a id="camera-icon" class="p10" ng-click="openScanner()"><i class="icon-scan size-21"></i></a>'
        }
      }
    ]);
