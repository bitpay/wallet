'use strict';

angular.module('copayApp.controllers').controller('tabScanController', function($scope, $timeout, $ionicModal, $log, $ionicPopup, configService, gettextCatalog, platformInfo, bitcore, lodash, $state) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var isIOS = platformInfo.isIOS;

  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;

  var unitToSatoshi = walletSettings.unitToSatoshi;
  var unitDecimals = walletSettings.unitDecimals;
  var satToUnit = 1 / unitToSatoshi;

  var _showAlert = function(title, msg, cb) {
    $log.warn(title +  ":"+ msg);
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: msg
    });

    if (!cb) cb = function(res) {};

    alertPopup.then(cb);
  };

  var _dataScanned = function(data) {
    var parsedData = _parseFromUri(data);

    if (lodash.isEmpty(parsedData)) {
      _showAlert('Bad bitcoin address', 'Could not recognize the bitcoin address', function(res) {
        $scope.init();
      });
      return;
    }

    $state.go('confirm', parsedData);
  };

  var _parseFromUri = function(uri) {

    function sanitizeUri(uri) {
      // Fixes when a region uses comma to separate decimals
      var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
      var match = regex.exec(uri);
      if (!match || match.length === 0) {
        return uri;
      }
      var value = match[0].replace(',', '.');
      var newUri = uri.replace(regex, value);
      return newUri;
    };

    var satToUnit = 1 / unitToSatoshi;

    // URI extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin:\?r=[\w+]/).exec(uri)) {
      // TODO: PAYPRO
    } else {
      uri = sanitizeUri(uri);

      if (!bitcore.URI.isValid(uri)) {
        return uri;
      }
      var parsed = new bitcore.URI(uri);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ?
        (parsed.amount.toFixed(0) * satToUnit).toFixed(unitDecimals) : 0;


      if (parsed.r) {
        // TODO: PAYPRO
      } else {
        // TODO: message
        return {
          toAddress: addr,
          toAmount: amount
        };
      }
    }

  };

  var onSuccess = function(result) {
    $timeout(function() {
      window.plugins.spinnerDialog.hide();
    }, 100);
    if (isWP && result.cancelled) return;

    $timeout(function() {
      var data = isIOS ? result : result.text;
      // Check if the current page is tabs.scan
      if ($state.is('tabs.scan')) {
        _dataScanned(data);
        return;
      }
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
    if (video && video.src) video.src = '';
  };

  qrcode.callback = function(data) {
    if (prevResult != data) {
      prevResult = data;
      return;
    }
    // Check if the current page is tabs.scan
    _scanStop();
    if ($state.is('tabs.scan')) {
      _dataScanned(data);
      return;
    }
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
    if (isCordova) {
      $scope.cordovaOpenScanner();
      return;
    }
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

  $scope.$on("$destroy", function(){
    _scanStop();
  });

});
