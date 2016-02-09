'use strict';

angular.module('copayApp.controllers').controller('scannerController', function($scope, $timeout) {

  var self = this;

  // QR code Scanner
  self.video;
  self.canvas;
  self.$video;
  self.context;
  self.localMediaStream;
  self.prevResult;
  self.scanTimer;

  var _scan = function(evt) {
    if (self.localMediaStream) {
      self.context.drawImage(self.video, 0, 0, 300, 225);
      try {
        qrcode.decode();
      } catch (e) {
        //qrcodeError(e);
      }
    }
    self.scanTimer = $timeout(_scan, 800);
  };

  var _scanStop = function() {
    $timeout.cancel(self.scanTimer);
    if (self.localMediaStream && self.localMediaStream.active) {
      var localMediaStreamTrack = self.localMediaStream.getTracks();
      for (var i = 0; i < localMediaStreamTrack.length; i++) {
        localMediaStreamTrack[i].stop();
      }
    } else {
      try {
        self.localMediaStream.stop();
      } catch(e) {
        // Older Chromium not support the STOP function
      };
    }
    self.localMediaStream = null;
    self.video.src = '';
  };

  qrcode.callback = function(data) {
    if (self.prevResult != data) {
      self.prevResult = data;
      return;
    }
    _scanStop();
    $scope.onScan({ data: data });
    $scope.cancel();
  };

  var _successCallback = function(stream) {
    self.video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    self.localMediaStream = stream;
    self.video.play();
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
      self.canvas = document.getElementById('qr-canvas');
      self.context = self.canvas.getContext('2d');

      self.video = document.getElementById('qrcode-scanner-video');
      self.$video = angular.element(self.video);
      self.canvas.width = 300;
      self.canvas.height = 225;
      self.context.clearRect(0, 0, 300, 225);

      navigator.getUserMedia({
        video: true
      }, _successCallback, _videoError);
    }, 500);
  };

  $scope.cancel = function() {
    _scanStop();
    $scope.scannerModal.hide();
  };

});