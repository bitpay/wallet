'use strict';

angular.module('copayApp.controllers').controller('joinController',
  function($scope, $rootScope, $timeout, go, isMobile, notification, profileService) {
    var self = this;

    self.isMobile = isMobile.any();
    $rootScope.title = 'Join shared wallet';

    // QR code Scanner
    var cameraInput;
    var video;
    var canvas;
    var $video;
    var context;
    var localMediaStream;

    self.hideAdv = true;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (!window.cordova && !navigator.getUserMedia)
      self.disableScanner = 1;

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
      self.showScanner = false;
      if (!self.isMobile) {
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
        self.secret = data;
        self.joinForm.secret.$setViewValue(data);
        self.joinForm.secret.$render();
      });
    };

    self.cancelScanner = function() {
      _scanStop();
    };

    self.openScanner = function() {
      if (window.cordova) return self.scannerIntent();

      self.showScanner = true;

      // Wait a moment until the canvas shows
      $timeout(function() {
        canvas = document.getElementById('qr-canvas');
        context = canvas.getContext('2d');

        if (self.isMobile) {
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

    self.scannerIntent = function() {
      window.ignoreMobilePause = true;
      cordova.plugins.barcodeScanner.scan(
        function onSuccess(result) {
          $timeout(function() {
            window.ignoreMobilePause = false;
          }, 100);
          if (result.cancelled) return;

          self.secret = result.text;
          $rootScope.$digest();
        },
        function onError(error) {
          $timeout(function() {
            window.ignoreMobilePause = false;
          }, 100);
          alert('Scanning error');
        });
    }


    self.join = function(form) {
      if (form && form.$invalid) {
        notification.error('Error', 'Please enter the required fields');
        return;
      }

      // TODO Priv key, nickname
      profileService.joinWallet({
        secret: form.secret.$modelValue,
        //        nickname: form.nickname.$modelValue,
        privateHex: form.privateKey.$modelValue,
      }, function(err) {
        if (err) {

          // TODO -> parse errors
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
        } else {
          go.walletHome();
        }


        $timeout(function() {
          $rootScope.$apply();
        }, 1);
      });
    }
  });
