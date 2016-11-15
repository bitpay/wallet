'use strict';

angular.module('copayApp.services').service('startupService', function($log, $timeout, platformService) {

  var splashscreenVisible = true;
  var statusBarVisible = false;
  var startupComplete = false;

  function _hideSplash(){
    if(typeof navigator.splashscreen !== "undefined" && splashscreenVisible){
      $log.debug('startupService: hiding the splashscreen...');
      $timeout(function(){
        navigator.splashscreen.hide();
      }, 20);
      splashscreenVisible = false;
    }
  }
  function _showStatusBar(){
    if(typeof StatusBar !== "undefined" && !statusBarVisible){
      $log.debug('startupService: showing the StatusBar...');
      StatusBar.show();
      statusBarVisible = true;
    }
  }
  function _electronStartupComplete(){
    if(!startupComplete && platformService.electron){
      $log.debug('startupService: sending "startup-complete" to electron...');
      platformService.electron.ipcRenderer.send('startup-complete');
      startupComplete = true;
    }
  }
  this.ready = function() {
    $log.debug('startupService: "ready" called.');
    _showStatusBar();
    _hideSplash();
    _electronStartupComplete();
  };
});
