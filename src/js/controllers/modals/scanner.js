'use strict';

angular.module('copayApp.controllers').controller('scannerController', function($scope, $timeout) {

  // QR code Scanner
  var video;
  var canvas;
  var $video;
  var context;
  var localMediaStream;
  var prevResult;
  var scanTimer;

  var _scan = function(evt) {
    if (localMediaStream) {
      context.drawImage(video, 0, 0, 300, 225);
      try {
        qrcode.decode();
      } catch (e) {
        //qrcodeError(e);
      }
    }
    scanTimer = $timeout(_scan, 800);
  };

  var _scanStop = function() {
    $timeout.cancel(scanTimer);
    if (localMediaStream && localMediaStream.active) {
      var localMediaStreamTrack = localMediaStream.getTracks();
      for (var i = 0; i < localMediaStreamTrack.length; i++) {
        localMediaStreamTrack[i].stop();
      }
    } else {
      try {
        localMediaStream.stop();
      } catch (e) {
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
    $scope.cancel();
    $scope.onScan({
      data: data
    });
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
      if ($scope.beforeScan) {
        $scope.beforeScan();
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
    $scope.scannerModal.hide();
    $scope.scannerModal.remove();
  };

});
