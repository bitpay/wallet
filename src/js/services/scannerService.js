'use strict';

angular.module('copayApp.services').service('scannerService', function($log, $timeout, platformInfo) {

  var isDesktop = !platformInfo.isCordova;
  var QRScanner = window.QRScanner;
  var lightEnabled = false;
  var backCamera = true; // the plugin defaults to the back camera

  // Initalize known capabilities
  var hasPermission = isDesktop? true: false;
  var canEnableLight = false;
  var canChangeCamera = false;

  function _checkCapabilities(status){
    $log.debug('scannerService is reviewing platform capabilities...');
    // Permission can be assumed on the desktop builds
    hasPermission = (isDesktop || status.authorized)? true: false;
    canEnableLight = status.canEnableLight? true : false;
    canChangeCamera = status.canChangeCamera? true : false;
    function orIsNot(bool){
      return bool? '' : 'not ';
    }
    $log.debug('A light is ' + orIsNot(canEnableLight) + 'available on this platform.');
    $log.debug('A second camera is ' + orIsNot(canChangeCamera) + 'available on this platform.');
  }

  /**
   * Immediately return known capabilities of the current platform.
   */
  this.getCapabilities = function(){
    return {
      hasPermission: hasPermission,
      canEnableLight: canEnableLight,
      canChangeCamera: canChangeCamera
    }
  }

  /**
   * If camera access has been granted, pre-initialize the QRScanner. This method
   * can be safely called before the scanner is visible to improve perceived
   * scanner loading times.
   *
   * The `status` of QRScanner is returned to the callback.
   */
  this.gentleInitialize = function(callback) {
    $log.debug('Trying to pre-initialize QRScanner.');
    if(!isDesktop){
      QRScanner.getStatus(function(status){
        _checkCapabilities(status);
        if(status.authorized){
          $log.debug('Camera permission already granted.');
          _initalize();
        } else {
          $log.debug('QRScanner not authorized, waiting to initalize.');
          if(typeof callback === "function"){
            callback && callback(status);
          }
        }
      });
    } else {
      $log.debug('Camera permission assumed on desktop.');
      _initalize();
    }
    function _initalize(){
      $log.debug('Preparing scanner...');
      QRScanner.prepare(function(err, status){
        if(err){
          $log.error(err);
        }
        _checkCapabilities(status);
        callback && callback(status);
      });
    }
  };

  var nextHide = null;
  var nextDestroy = null;
  var hideAfterSeconds = 15;
  var destroyAfterSeconds = 5 * 60;

  /**
   * (Re)activate the QRScanner, and cancel the timeouts if present.
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */
  this.activate = function(callback) {
    $log.debug('Activating scanner...');
      QRScanner.show(function(status){
        _checkCapabilities(status);
        callback(status);
      });
      if(nextHide !== null){
        $timeout.cancel(nextHide);
        nextHide = null;
      }
      if(nextDestroy !== null){
        $timeout.cancel(nextDestroy);
        nextDestroy = null;
      }
  };

  /**
   * Start a new scan.
   *
   * The callback receives: (err, contents)
   */
  this.scan = function(callback) {
    $log.debug('Scanning...');
    QRScanner.scan(callback);
  };

  /**
   * Deactivate the QRScanner. To balance user-perceived performance and power
   * consumption, this kicks off a countdown which will "sleep" the scanner
   * after a certain amount of time.
   *
   * The `status` of QRScanner is passed to the callback when deactivation
   * is complete.
   */
  this.deactivate = function(callback) {
    $log.debug('Deactivating scanner...');
    QRScanner.cancelScan();
    nextHide = $timeout(_hide, hideAfterSeconds * 1000);
    nextDestroy = $timeout(_destroy, destroyAfterSeconds * 1000);
  };

  // Natively hide the QRScanner's preview
  // On mobile platforms, this can reduce GPU/power usage
  // On desktop, this fully turns off the camera (and any associated privacy lights)
  function _hide(){
    $log.debug('Scanner not in use for ' + hideAfterSeconds + ' seconds, hiding...');
    QRScanner.hide();
  }

  // Reduce QRScanner power/processing consumption by the maximum amount
  function _destroy(){
    $log.debug('Scanner not in use for ' + destroyAfterSeconds + ' seconds, destroying...');
    QRScanner.destroy();
  }

  /**
   * Toggle the device light (if available).
   *
   * The callback receives a boolean which is `true` if the light is enabled.
   */
  this.toggleLight = function(callback) {
    $log.debug('Toggling light...');
    if(lightEnabled){
      QRScanner.disableLight(_handleResponse);
    } else {
      QRScanner.enableLight(_handleResponse);
    }
    function _handleResponse(err, status){
      if(err){
        $log.error(err);
      } else {
        lightEnabled = status.lightEnabled;
        var state = lightEnabled? 'enabled' : 'disabled';
        $log.debug('Light ' + state + '.');
      }
      callback(lightEnabled);
    }
  };

  /**
   * Switch cameras (if a second camera is available).
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */
  this.toggleCamera = function(callback) {
    var nextCamera = backCamera? 1 : 0;
    function cameraToString(index){
      return index === 1? 'front' : 'back'; // front = 1, back = 0
    };
    $log.debug('Toggling to the ' + cameraToString(nextCamera) + ' camera...');
    QRScanner.useCamera(nextCamera, function(err, status){
      if(err){
        $log.error(err);
      }
      backCamera = status.currentCamera === 1? false : true;
      $log.debug('Camera toggled. Now using the ' + cameraToString(backCamera) + ' camera.');
      callback(status);
    });
  };
});
