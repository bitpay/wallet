'use strict';

angular.module('copayApp.controllers').controller('tabScanController', function($scope, $log, $timeout, scannerService, incomingData, $state, $ionicHistory, $rootScope, platformInfo,  $stateParams) {
  // ios camera / web scanner
  $scope.cameraSupported = platformInfo.cameraSupported
  $scope.webRtcCameraNumber = 0
  $scope.usingWebRtc = false
  $scope.webRtcStarted = false
  $scope.webRtcDenied = false
  $scope.retryPhoto = false
  $scope.videoScanInterval
  var cameras = []

  var scannerStates = {
    unauthorized: 'unauthorized',
    denied: 'denied',
    unavailable: 'unavailable',
    loading: 'loading',
    visible: 'visible',
  };
  $scope.scannerStates = scannerStates;

  function _updateCapabilities(){
    var capabilities = scannerService.getCapabilities();
    $scope.scannerIsAvailable = capabilities.isAvailable;
    $scope.scannerHasPermission = capabilities.hasPermission;
    $scope.scannerIsDenied = capabilities.isDenied;
    $scope.scannerIsRestricted = capabilities.isRestricted;
    $scope.canEnableLight = capabilities.canEnableLight;
    $scope.canChangeCamera = capabilities.canChangeCamera;
    $scope.canOpenSettings = capabilities.canOpenSettings;
  }

  function _handleCapabilities(){
    // always update the view
    if (platformInfo.cameraType === 'native') {
      $timeout(function(){
        if(!scannerService.isInitialized()){
          $scope.currentState = scannerStates.loading;
        } else if(!$scope.scannerIsAvailable){
          $scope.currentState = scannerStates.unavailable;
        } else if($scope.scannerIsDenied){
          $scope.currentState = scannerStates.denied;
        } else if($scope.scannerIsRestricted){
          $scope.currentState = scannerStates.denied;
        } else if(!$scope.scannerHasPermission){
          $scope.currentState = scannerStates.unauthorized;
        }
        $log.debug('Scan view state set to: ' + $scope.currentState);
      }, 2000);
    }
  }

  function _refreshScanView(){
    _updateCapabilities();
    _handleCapabilities();
    if($scope.scannerHasPermission){
      activate();
    }
  }

  // This could be much cleaner with a Promise API
  // (needs a polyfill for some platforms)
  $rootScope.$on('scannerServiceInitialized', function(){
    $log.debug('Scanner initialization finished, reinitializing scan view...');
    _refreshScanView();
  });


  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (platformInfo.cameraType === 'native') {
      _handleCapabilities();
      $timeout(function() {
          _refreshScanView()
        },
        5000);
    }
    $scope.returnRoute = $state.params.returnRoute || false;
  });

  $scope.$on("$ionicView.afterEnter", function() {
    // try initializing and refreshing status any time the view is entered
    if(!scannerService.isInitialized() && platformInfo.cameraType === 'native'){
      scannerService.gentleInitialize();
    }
    activate();
  });

  $scope.$on("$ionicView.afterLeave", function() {
    scannerService.deactivate();
  });


  function stopWebRtcCamera() {
    clearInterval($scope.videoScanInterval)
    var video = document.getElementById('webRtcScanner')
    if ($scope.stream) {
      $scope.stream.getVideoTracks().forEach(function(track) {
        track.stop()
      } )
    }
  }

  function activateWebRTCCamera(camera) {
    // debugger;
    $scope.usingWebRtc = true;
    var video = document.getElementById('webRtcScanner')
    stopWebRtcCamera()
    $log.debug('Using camera', camera)
     navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: camera.deviceId } }, audio: false })
             .then(function (stream) {
               $scope.stream = stream
               video.srcObject = stream;
               video.onloadedmetadata = function(e) { video.play(); }
               $scope.currentState = scannerStates.visible;
               $scope.webRtcDenied = false;
               $scope.webRtcStarted = true;
               $scope.$apply()
               $scope.videoScanInterval = setInterval(function() {
                 // because the leave events dont fire. We dont know when to stop this
                 // So we have the internval check itself if ti should be stopped
                 // need to check the dom each time not the cached video
                 if (document.getElementById('webRtcScanner')) {
                   scanVideo(video);
                 } else {
                   stopWebRtcCamera();
                 }
               }, 1000)
             }).catch(function (err) {
                $scope.webRtcDenied = true;
                $scope.webRtcStarted = false;
                $log.error('webRTC failed', err);
                $scope.$apply()
             })
  }


  function activate(){
    $log.debug('Scanner activated, setting to visible...');
    $log.debug('platformInfo.cameraType', platformInfo.cameraType);
    switch(platformInfo.cameraType) {
      case 'native':
        scannerService.activate(function () {
          _updateCapabilities();
          _handleCapabilities();
          $scope.currentState = scannerStates.visible;
          // pause to update the view
          $timeout(function () {
            scannerService.scan(function (err, contents) {
              if (err) {
                $log.debug('Scan canceled.');
              } else if ($state.params.passthroughMode) {
                $rootScope.scanResult = contents;
                goBack();
              } else {
                handleSuccessfulScan(contents);
              }
            });
            // resume preview if paused
            scannerService.resumePreview();
          });
        })
        break;
      case 'webrtc':
        $log.debug("Using webrtc - Starting webcam")
        // $scope.currentState = scannerStates.loading;
        $scope.usingWebRtc = true
        var video = document.getElementById('webRtcScanner')
        // Check if multiple cameras
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
          devices.map(function (device) {
            if (device.kind === 'videoinput') { cameras.push(device) }
          })

          if (cameras.length > 1) {
            $scope.canChangeCamera = true
            cameras.forEach(function (camera, i) {
              // Check if we have a camera on the back on the device
              if (camera.label.includes('back')) {$scope.webRtcCameraNumber = i}
            })
          }
          // defaults to cameras[0]
          activateWebRTCCamera(cameras[$scope.webRtcCameraNumber])
        })
        break;
      case 'photo':
        $log.debug('Using photo method');
        $scope.usingPhotoInput = true;
        $scope.$apply()
        break;
      default:
        $log.debug('Cameras not supported');
        $scope.cameraSupported = false;
        $scope.$apply()
    }
  }

  $scope.activate = activate;

  $scope.authorize = function(){
    scannerService.initialize(function(){
      _refreshScanView();
    });
  };

  function handleSuccessfulScan(contents){
    $log.debug('Scan returned: "' + contents + '"');
    scannerService.pausePreview();
    if ($scope.usingWebRtc) { stopWebRtcCamera() }

    var trimmedContents = contents.replace('navcoin:', '');
    if ($scope.returnRoute) {
      $state.go($scope.returnRoute, { address: trimmedContents });
    } else {
      incomingData.redir(trimmedContents);
    }
  }

  $rootScope.$on('incomingDataMenu.menuHidden', function() {
    activate();
  });

  $scope.openSettings = function(){
    scannerService.openSettings();
  };

  $scope.attemptToReactivate = function(){
    scannerService.reinitialize();
  };

  $scope.toggleLight = function(){
    scannerService.toggleLight(function(lightEnabled){
      $scope.lightActive = lightEnabled;
      $scope.$apply();
    });
  };

  $scope.toggleCamera = function(){
    // This function gets fired twice on Chrome. No idea why.
    // So we use this check to exit out.
    if ($scope.cameraToggleActive) { return }

    $scope.cameraToggleActive = true;

    if ($scope.usingWebRtc) {
      // switch the camera
      // Get the next in the cameras array, if there isn't. Reset to 0.
      $scope.webRtcCameraNumber = cameras[$scope.webRtcCameraNumber + 1] ? $scope.webRtcCameraNumber + 1 : 0
      activateWebRTCCamera(cameras[$scope.webRtcCameraNumber])
    } else {
      scannerService.toggleCamera();
    }

    // Add a relday to stop the double firing
    $timeout(function(){
      $scope.cameraToggleActive = false;
      $log.debug('Camera toggle control deactivated.');
    }, 1000);

  };

  var scanVideo = function(video) {
    window.requestAnimationFrame(function() {
      console.log('scanning')

      var canvas = document.getElementById("hiddenCanvas");
      var ctx = canvas.getContext("2d");
      var height = video.videoHeight
      var width = video.videoWidth
      ctx.canvas.height = height
      ctx.canvas.width = width

      ctx.drawImage(video, 0, 0, width, height);

      // Get the image data, and run it through jsQR
      var imageData = ctx.getImageData(0, 0, width, height);
      var scanResults = jsQR(imageData.data, width, height)

      $log.debug('QR Code', scanResults)
      if (scanResults && scanResults.data.includes('navcoin')) {
        handleSuccessfulScan(scanResults.data);
      }

    })
  }

  // This scans a photo taken with iOS
  // that don't have proper support
  $scope.scanPhoto = function(event) {
    $scope.retryPhoto = false;
    // Get the photo
    // Get the canvas
    var file = event.target.files[0]
    var canvas = document.getElementById("hiddenCanvas");
    var ctx = canvas.getContext("2d");

    var reader  = new FileReader();

    reader.onload = function (e) {
      //Initiate the JavaScript Image object.
      var image = new Image();
      var maxImageHeight = 1000

      // Once the image is loaded...
      image.onload = function () {
        // Resize image and there is big slow down on large images
        if(image.height > maxImageHeight) {
          image.width = image.width * maxImageHeight / image.height;
          image.height = maxImageHeight;
        }
        ctx.canvas.height = image.height
        ctx.canvas.width = image.width

        ctx.drawImage(image, 0, 0, image.width, image.height);

        // Get the image data, and run it through jsQR
        var imageData = ctx.getImageData(0, 0, image.width, image.height);
        var scanResults = jsQR(imageData.data, image.width, image.height)

        $log.debug('QR Code', scanResults)
        if (scanResults && scanResults.data.includes('navcoin')) {
          handleSuccessfulScan(scanResults.data);
        } else {
          // Ask user to try again
          $scope.retryPhoto = true;
          $scope.$apply();
        }
      };
      // Load the file into the image src so we can read it
      image.src = reader.result
    }
    // Create data url of the file so we can use it in a img tag
    reader.readAsDataURL(file);
  }

  $scope.canGoBack = function(){
    return $state.params.passthroughMode;
  };
  function goBack(){
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.backView().go();
  }
  $scope.goBack = goBack;
});
