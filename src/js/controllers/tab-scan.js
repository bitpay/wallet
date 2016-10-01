'use strict';

angular.module('copayApp.controllers').controller('tabScanController', function($scope, $log, $timeout, scannerService, incomingData) {

  $scope.$on("$ionicView.beforeEnter", function() {
    $log.debug('Preparing to display available controls.');
    var capabilities = scannerService.getCapabilities();
    $scope.canEnableLight = capabilities.canEnableLight;
    $scope.canChangeCamera = capabilities.canChangeCamera;
  });

  $scope.$on("$ionicView.afterEnter", function() {
    scannerService.activate(function(){
      scannerService.scan(function(err, contents){
        if(err){
          $log.debug('Scan canceled.');
        } else {
          incomingData.redir(contents);
        }
      });
    });
  });
  $scope.$on("$ionicView.afterLeave", function() {
    scannerService.deactivate();
  });

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
      }, 200);
    });
  };

});
