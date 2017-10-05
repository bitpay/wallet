'use strict';

angular.module('copayApp.services').service('scannerService', function($log, $timeout, platformInfo, $rootScope, $window) {

  var isDesktop = !platformInfo.isCordova;
  var QRScanner = $window.QRScanner;
  var lightEnabled = false;
  var backCamera = true; // the plugin defaults to the back camera

  // Initalize known capabilities
  // Assume camera is available. If init fails, we'll set this to false.
  var isAvailable = true;
  var hasPermission = false;
  var isDenied = false;
  var isRestricted = false;
  var canEnableLight = false;
  var canChangeCamera = false;
  var canOpenSettings = false;

  function _checkCapabilities(status) {
    $log.debug('scannerService is reviewing platform capabilities...');
    // Permission can be assumed on the desktop builds
    hasPermission = (isDesktop || status.authorized) ? true : false;
    isDenied = status.denied ? true : false;
    isRestricted = status.restricted ? true : false;
    canEnableLight = status.canEnableLight ? true : false;
    canChangeCamera = status.canChangeCamera ? true : false;
    canOpenSettings = status.canOpenSettings ? true : false;
    _logCapabilities();
  }

  function _logCapabilities() {
    function _orIsNot(bool) {
      return bool ? '' : 'not ';
    }
    $log.debug('A camera is ' + _orIsNot(isAvailable) + 'available to this app.');
    var access = 'not authorized';
    if (hasPermission) access = 'authorized';
    if (isDenied) access = 'denied';
    if (isRestricted) access = 'restricted';
    $log.debug('Camera access is ' + access + '.');
    $log.debug('Support for opening device settings is ' + _orIsNot(canOpenSettings) + 'available on this platform.');
    $log.debug('A light is ' + _orIsNot(canEnableLight) + 'available on this platform.');
    $log.debug('A second camera is ' + _orIsNot(canChangeCamera) + 'available on this platform.');
  }

  /**
   * Immediately return known capabilities of the current platform.
   */
  this.getCapabilities = function() {
    return {
      isAvailable: isAvailable,
      hasPermission: hasPermission,
      isDenied: isDenied,
      isRestricted: isRestricted,
      canEnableLight: canEnableLight,
      canChangeCamera: canChangeCamera,
      canOpenSettings: canOpenSettings
    };
  };

  var initializeStarted = false;
  /**
   * If camera access has been granted, pre-initialize the QRScanner. This method
   * can be safely called before the scanner is visible to improve perceived
   * scanner loading times.
   *
   * The `status` of QRScanner is returned to the callback.
   */
  this.gentleInitialize = function(callback) {
    if (initializeStarted && !isDesktop) {
      QRScanner.getStatus(function(status) {
        _completeInitialization(status, callback);
      });
      return;
    }
    initializeStarted = true;
    $log.debug('Trying to pre-initialize QRScanner.');
    if (!isDesktop) {
      QRScanner.getStatus(function(status) {
        _checkCapabilities(status);
        if (status.authorized) {
          $log.debug('Camera permission already granted.');
          initialize(callback);
        } else {
          $log.debug('QRScanner not authorized, waiting to initalize.');
          _completeInitialization(status, callback);
        }
      });
    } else {
      $log.debug('To avoid flashing the privacy light, we do not pre-initialize the camera on desktop.');
    }
  };

  function initialize(callback) {
    $log.debug('Initializing scanner...');
    QRScanner.prepare(function(err, status) {
      if (err) {
        isAvailable = false;
        $log.error(err);
        // does not return `status` if there is an error
        QRScanner.getStatus(function(status) {
          _completeInitialization(status, callback);
        });
      } else {
        _completeInitialization(status, callback);
      }
    });
  }
  this.initialize = initialize;

  // This could be much cleaner with a Promise API
  // (needs a polyfill for some platforms)
  var initializeCompleted = false;

  function _completeInitialization(status, callback) {
    _checkCapabilities(status);
    initializeCompleted = true;
    $rootScope.$emit('scannerServiceInitialized');
    if (typeof callback === "function") {
      callback(status);
    }
  }
  this.isInitialized = function() {
    return initializeCompleted;
  };
  this.initializeStarted = function() {
    return initializeStarted;
  };

  var nextHide = null;
  var nextDestroy = null;
  var hideAfterSeconds = 5;
  var destroyAfterSeconds = 60;

  /**
   * (Re)activate the QRScanner, and cancel the timeouts if present.
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */
  this.activate = function(callback) {
    $log.debug('Activating scanner...');
    QRScanner.show(function(status) {
      initializeCompleted = true;
      _checkCapabilities(status);
      if (typeof callback === "function") {
        callback(status);
      }
    });
    if (nextHide !== null) {
      $timeout.cancel(nextHide);
      nextHide = null;
    }
    if (nextDestroy !== null) {
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

  this.pausePreview = function() {
    QRScanner.pausePreview();
  };

  this.resumePreview = function() {
    QRScanner.resumePreview();
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
  function _hide() {
    $log.debug('Scanner not in use for ' + hideAfterSeconds + ' seconds, hiding...');
    QRScanner.hide();
  }

  // Reduce QRScanner power/processing consumption by the maximum amount
  function _destroy() {
    $log.debug('Scanner not in use for ' + destroyAfterSeconds + ' seconds, destroying...');
    QRScanner.destroy();
  }

  this.reinitialize = function(callback) {
    initializeCompleted = false;
    QRScanner.destroy();
    initialize(callback);
  };

  /**
   * Toggle the device light (if available).
   *
   * The callback receives a boolean which is `true` if the light is enabled.
   */
  this.toggleLight = function(callback) {
    $log.debug('Toggling light...');
    if (lightEnabled) {
      QRScanner.disableLight(_handleResponse);
    } else {
      QRScanner.enableLight(_handleResponse);
    }

    function _handleResponse(err, status) {
      if (err) {
        $log.error(err);
      } else {
        lightEnabled = status.lightEnabled;
        var state = lightEnabled ? 'enabled' : 'disabled';
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
    var nextCamera = backCamera ? 1 : 0;

    function cameraToString(index) {
      return index === 1 ? 'front' : 'back'; // front = 1, back = 0
    }
    $log.debug('Toggling to the ' + cameraToString(nextCamera) + ' camera...');
    QRScanner.useCamera(nextCamera, function(err, status) {
      if (err) {
        $log.error(err);
      }
      backCamera = status.currentCamera === 1 ? false : true;
      $log.debug('Camera toggled. Now using the ' + cameraToString(backCamera) + ' camera.');
      callback(status);
    });
  };

  this.openSettings = function() {
    $log.debug('Attempting to open device settings...');
    QRScanner.openSettings();
  };

  this.useOldScanner = function(callback) {
    cordova.plugins.barcodeScanner.scan(
      function(result) {
        callback(null, result.text);
      },
      function(error) {
        callback(error);
      }
    );
  }
});
