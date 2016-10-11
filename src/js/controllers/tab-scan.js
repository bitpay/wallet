'use strict';

angular.module('copayApp.controllers').controller('tabScanController', function($scope, $log, $timeout, scannerService, incomingData, $state, $ionicHistory, $rootScope) {

  var scannerStates = {
    unauthorized: 'unauthorized',
    denied: 'denied',
    unavailable: 'unavailable',
    loading: 'loading',
    visible: 'visible'
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
    if(!$scope.scannerIsAvailable){
      $scope.currentState = scannerStates.unavailable;
    } else if($scope.scannerIsDenied){
      $scope.currentState = scannerStates.denied;
    } else if($scope.scannerIsRestricted){
      $scope.currentState = scannerStates.denied;
    } else if(!$scope.scannerHasPermission){
      $scope.currentState = scannerStates.unauthorized;
    } else if($scope.scannerHasPermission){
      activate();
    }
  }

  function _initScanView(){
    _updateCapabilities();
    _handleCapabilities();
  }

  $scope.$on("$ionicView.beforeEnter", function() {
    $scope.currentState = scannerStates.loading;
  });

  // This could be much cleaner with a Promise API
  // (needs a polyfill for some platforms)
  $rootScope.$on('scannerServiceInitialized', function(){
    $log.debug('Scanner initialization finished, reinitializing scan view...');
    _initScanView();
  });

  $scope.$on("$ionicView.afterEnter", function() {
    if(scannerService.isInitialized()){
      _initScanView();
    }
  });

  function activate(){
    scannerService.activate(function(){
      $log.debug('Scanner activated, setting to visible...');
      $scope.currentState = scannerStates.visible;
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
    });
  }

  $scope.$on("$ionicView.afterLeave", function() {
    scannerService.deactivate();
  });

  function handleSuccessfulScan(contents){
    $log.debug('Scan returned: "' + contents + '"');
    incomingData.redir(contents);
  }

  $scope.toggleLight = function(){
    scannerService.toggleLight(function(lightEnabled){
      $scope.lightActive = lightEnabled;
      $scope.$apply();
    });
  };

  $scope.toggleCamera = function(){
    $scope.cameraToggleActive = true;
    scannerService.toggleCamera(function(status){
    // (a short delay for the user to see the visual feedback)
      $timeout(function(){
        $scope.cameraToggleActive = false;
        $log.debug('Camera toggle control deactivated.');
      }, 600);
    });
  };

  $scope.canGoBack = function(){
    return $state.params.passthroughMode;
  }
  function goBack(){
    $ionicHistory.backView().go();
  }
  $scope.goBack = goBack;
});
