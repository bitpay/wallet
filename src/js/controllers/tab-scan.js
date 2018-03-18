'use strict';

angular.module('copayApp.controllers').controller('tabScanController', function($scope, $log, $timeout, scannerService, incomingData, $state, $ionicHistory, $rootScope, platformInfo) {
  // ios camera / web scanner
  $scope.startedWebCamera = false
  $scope.canChangeWebScannerCamera = false
  $scope.webScannerCameraNumber = 0
  $scope.scannerStates = scannerStates;
  $scope.usingWebRtc = false
  $scope.webRtcDenied = false
  $scope.cameraSupported = platformInfo.cameraSupported
  $scope.retryPhoto = false
  var webScanner

  if (platformInfo.cameraType === 'webrtc') {
    $log.debug("Using webrtc")
    // if (!navigator.getUserMedia) {
    //   navigator.getUserMedia = navigator.webkitGetUserMedia;
    // }
    $scope.usingWebRtc = true
    webScanner = new Instascan.Scanner({ video: document.getElementById('webScanner'), scanPeriod: 5 })
    webScanner.addListener('scan', function (content) {
      handleSuccessfulScan(content);
    });
  }

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
    });
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
    _handleCapabilities();
    $timeout(function() {
        _refreshScanView()
      },
      5000);
    $scope.returnRoute = data.stateParams.returnRoute || false;
  });

  $scope.$on("$ionicView.afterEnter", function() {
    // try initializing and refreshing status any time the view is entered
    if(!scannerService.isInitialized() && platformInfo.cameraType === 'native'){
      scannerService.gentleInitialize();
    }
    activate();
  });

  function activate(){
    $log.debug('Scanner activated, setting to visible...');
    switch(platformInfo.cameraType) {
      case 'native':
        scannerService.activate(function(){
          _updateCapabilities();
          _handleCapabilities();
          $scope.currentState = scannerStates.visible;
          // pause to update the view
          $timeout(function(){
            scannerService.scan(function(err, contents){
              if(err){
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
        Instascan.Camera.getCameras().then(function (cameras) {
          if (cameras.length > 0) {
            if (cameras.length > 1) { $scope.canChangeWebScannerCamera = true }
            $scope.startedWebCamera = true;
            $scope.usingWebRtc = true;
            $scope.currentState = scannerStates.visible;
            $scope.webScannerCameraNumber = 0;
            $scope.webRtcDenied = false;
            webScanner.start(cameras[0]);
            $log.debug("Webrtc active")
          } else {
            $log.debug('No cameras found.');
            $scope.usingWebRtc = false;
            $scope.cameraSupported = false;
          }
        }).catch(function (e) {
          $scope.usingWebRtc = false;
          if (e.name === 'NotAllowedError') {
            $scope.webRtcDenied = true;
            $scope.currentState = scannerStates.denied;
          }
          $scope.$apply()
          $log.error('webRTC failed', e);
        });
        break;
      case 'photo':
        $log.debug('Using photo method');
        $scope.usingPhotoInput = true;
        $scope.$apply()
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

  $scope.$on("$ionicView.afterLeave", function() {
    scannerService.deactivate();
  });

  function handleSuccessfulScan(contents){
    $log.debug('Scan returned: "' + contents + '"');
    scannerService.pausePreview();
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
    $scope.cameraToggleActive = true;

    if ($scope.startedWebCamera) {
      // Set to opposite camera
      $scope.webScannerCameraNumber = $scope.webScannerCameraNumber === 0 ? 1 : 0
      Instascan.Camera.getCameras().then(function (cameras) {
        webScanner.start(cameras[$scope.webScannerCameraNumber]);
      }).catch(function (e) {
        $log.debug(JSON.stringify(e));
      });
    } else {
      scannerService.toggleCamera();
    }

    // (a short delay for the user to see the visual feedback)
    $timeout(function(){
      $scope.cameraToggleActive = false;
      $log.debug('Camera toggle control deactivated.');
    }, 200);

  };

  // This scans a photo taken with iOS
  // that don't have proper support
  $scope.scanPhoto = function(event) {
    // Get the photo
    // Get the canvas
    const file = event.target.files[0]
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
          image.width *= maxImageHeight / image.height;
          image.height = maxImageHeight;
        }
        ctx.drawImage(image, 0, 0, image.width, image.height);

        // Get the image data, and run it through jsQR
        var imageData = ctx.getImageData(0, 0, image.width, image.height);
        var scanResults = jsQR(imageData.data, image.width, image.height)

        $log.debug('QR Code', scanResults)
        if (scanResults) {
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
