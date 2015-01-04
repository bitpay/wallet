'use strict';

angular.module('copayApp.controllers').controller('JoinController',
  function($scope, $rootScope, $timeout, isMobile, notification, identityService) {
    $rootScope.fromSetup = false;
    $scope.loading = false;
    $scope.isMobile = isMobile.any();
    $rootScope.title = 'Join shared wallet';
    $rootScope.hideWalletNavigation = true;


    // QR code Scanner
    var cameraInput;
    var video;
    var canvas;
    var $video;
    var context;
    var localMediaStream;

    $scope.hideAdv = true;


    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (!window.cordova && !navigator.getUserMedia)
      $scope.disableScanner = 1;

    var _scan = function(evt) {
      if (localMediaStream) {
        context.drawImage(video, 0, 0, 300, 225);

        try {
          qrcode.decode();
        } catch (e) {
          //qrcodeError(e);
        }
      }

      $timeout(_scan, 500);
    };

    var _successCallback = function(stream) {
      video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
      localMediaStream = stream;
      video.play();
      $timeout(_scan, 1000);
    };

    var _scanStop = function() {
      $scope.showScanner = false;
      if (!$scope.isMobile) {
        if (localMediaStream && localMediaStream.stop) localMediaStream.stop();
        localMediaStream = null;
        video.src = '';
      }
    };

    var _videoError = function(err) {
      _scanStop();
    };

    qrcode.callback = function(data) {
      _scanStop();

      $scope.$apply(function() {
        $scope.connectionId = data;
        $scope.joinForm.connectionId.$setViewValue(data);
        $scope.joinForm.connectionId.$render();
      });
    };

    $scope.cancelScanner = function() {
      _scanStop();
    };

    $scope.openScanner = function() {
      if (window.cordova) return $scope.scannerIntent();

      $scope.showScanner = true;

      // Wait a moment until the canvas shows
      $timeout(function() {
        canvas = document.getElementById('qr-canvas');
        context = canvas.getContext('2d');

        if ($scope.isMobile) {
          cameraInput = document.getElementById('qrcode-camera');
          cameraInput.addEventListener('change', _scan, false);
        } else {
          video = document.getElementById('qrcode-scanner-video');
          $video = angular.element(video);
          canvas.width = 300;
          canvas.height = 225;
          context.clearRect(0, 0, 300, 225);

          navigator.getUserMedia({
            video: true
          }, _successCallback, _videoError);
        }
      }, 500);
    };

    $scope.scannerIntent = function() {
      window.ignoreMobilePause = true;
      cordova.plugins.barcodeScanner.scan(
        function onSuccess(result) {
          $timeout(function(){
            window.ignoreMobilePause = false;
          }, 100);
          if (result.cancelled) return;

          $scope.connectionId = result.text;
          $rootScope.$digest();
        },
        function onError(error) {
          $timeout(function(){
            window.ignoreMobilePause = false;
          }, 100);
          alert('Scanning error');
        });
    }


    $scope.join = function(form) {
      if (form && form.$invalid) {
        notification.error('Error', 'Please enter the required fields');
        return;
      }

      $scope.loading = true;
      identityService.joinWallet({
        secret: $scope.connectionId,
        nickname: $scope.nickname,
        privateHex: $scope.private,
      }, function(err) {
        $scope.loading = false;
        if (err) {
          if (err === 'joinError')
            notification.error('Fatal error connecting to Insight server');
          else if (err === 'walletFull')
            notification.error('The wallet is full');
          else if (err === 'walletAlreadyExists')
            notification.error('Wallet already exists', 'Cannot join again from the same profile');
          else if (err === 'badNetwork')
            notification.error('Network Error', 'Wallet network configuration missmatch');
          else if (err === 'badSecret')
            notification.error('Bad secret', 'The secret string you entered is invalid');
          else {
            notification.error('Error', err.message || err);
          }
        }
        $timeout(function () { $scope.$digest(); }, 1);
      });
    }


    $scope.$on("$destroy", function () {
        $rootScope.hideWalletNavigation = false;
    });
  });
