import { Injectable } from '@angular/core';
import { PlatformInfo } from './platform-info.service';


@Injectable()
export class ScannerService {
  win: any = window;
  isDesktop: boolean = false;// = !platformInfo.isCordova;
  QRScanner: any = this.win.QRScanner;//this.win.QRScanner;
  lightEnabled: boolean = false;
  backCamera: boolean = true; // the plugin defaults to the back camera

  // Initalize known capabilities
  isAvailable: ConstrainBoolean = false;// = isDesktop? false: true; // assume camera exists on mobile
  hasPermission: boolean = false; //isDesktop? true: false; // assume desktop has permission
  isDenied: boolean = false;
  isRestricted: boolean = false;
  canEnableLight: boolean = false;
  canChangeCamera: boolean = false;
  canOpenSettings: boolean = false;

  initializeStarted: boolean = false;
  initializeCompleted: boolean = false;

  nextHide = null;
  nextDestroy = null;
  hideAfterSeconds: number = 10;
  destroyAfterSeconds: number = 5 * 60;

  constructor(platformInfo: PlatformInfo) {
    this.isDesktop = platformInfo.isCordova;
  }

  _checkCapabilities(status){
    //$log.debug('scannerService is reviewing platform capabilities...');
    // Permission can be assumed on the desktop builds
    this.hasPermission = (this.isDesktop || status.authorized) ? true: false;
    this.isDenied = status.denied ? true : false;
    this.isRestricted = status.restricted? true : false;
    this.canEnableLight = status.canEnableLight? true : false;
    this.canChangeCamera = status.canChangeCamera? true : false;
    this.canOpenSettings = status.canOpenSettings? true : false;
    this._logCapabilities();
  }

  _logCapabilities(){
    // let _orIsNot = (bool) => {
    //   return bool? '' : 'not ';
    // };
    //$log.debug('A camera is ' + _orIsNot(isAvailable) + 'available to this app.');
    let access = 'not authorized';
    if(this.hasPermission) access = 'authorized';
    if(this.isDenied) access = 'denied';
    if(this.isRestricted) access = 'restricted';
    // $log.debug('Camera access is ' + access + '.');
    // $log.debug('Support for opening device settings is ' + _orIsNot(canOpenSettings) + 'available on this platform.');
    // $log.debug('A light is ' + _orIsNot(canEnableLight) + 'available on this platform.');
    // $log.debug('A second camera is ' + _orIsNot(canChangeCamera) + 'available on this platform.');
  }

  /**
   * Immediately return known capabilities of the current platform.
   */
  getCapabilities (){
    return {
      isAvailable: this.isAvailable,
      hasPermission: this.hasPermission,
      isDenied: this.isDenied,
      isRestricted: this.isRestricted,
      canEnableLight: this.canEnableLight,
      canChangeCamera: this.canChangeCamera,
      canOpenSettings: this.canOpenSettings
    };
  };

  // var initializeStarted = false;
  /**
   * If camera access has been granted, pre-initialize the QRScanner. This method
   * can be safely called before the scanner is visible to improve perceived
   * scanner loading times.
   *
   * The `status` of QRScanner is returned to the callback.
   */
  gentleInitialize(callback?) {
    if(this.initializeStarted){
      this.QRScanner.getStatus(function(status){
        this._completeInitialization(status, callback);
      });
      return;
    }
    this.initializeStarted = true;
    //$log.debug('Trying to pre-initialize QRScanner.');
    if(!this.isDesktop){
      this.QRScanner.getStatus(function(status){
        this._checkCapabilities(status);
        if(status.authorized){
          //$log.debug('Camera permission already granted.');
          this.initialize(callback);
        } else {
          //$log.debug('QRScanner not authorized, waiting to initalize.');
          this._completeInitialization(status, callback);
        }
      });
    } else {
      //$log.debug('Camera permission assumed on desktop.');
      this.initialize(callback);
    }
  };

  initialize(callback){
    //this.QRScanner = this.win.QRScanner;
    //$log.debug('Initializing scanner...');
    this.QRScanner.prepare(function(err, status){
      if(err){
        //$log.error(err);
        // does not return `status` if there is an error
        this.QRScanner.getStatus(function(status){
          this._completeInitialization(status, callback);
        });
      } else {
        this.isAvailable = true;
        this._completeInitialization(status, callback);
      }
    });
  }

  // This could be much cleaner with a Promise API
  // (needs a polyfill for some platforms)
  // var initializeCompleted = false;
  _completeInitialization(status, callback){
    this._checkCapabilities(status);
    this.initializeCompleted = true;
    //$rootScope.$emit('scannerServiceInitialized');
    if(typeof callback === "function"){
      callback(status);
    }
  }
  isInitialized(){
    return this.initializeCompleted;
  };
  isInitializeStarted(){
    return this.initializeStarted;
  };

  // var nextHide = null;
  // var nextDestroy = null;
  // var hideAfterSeconds = 10;
  // var destroyAfterSeconds = 5 * 60;

  /**
   * (Re)activate the QRScanner, and cancel the timeouts if present.
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */
  activate(callback) {
    //$log.debug('Activating scanner...');
      this.QRScanner.show(function(status){
        this._checkCapabilities(status);
        if(typeof callback === "function"){
          callback(status);
        }
      });
      if(this.nextHide !== null){
        clearTimeout(this.nextHide);
        this.nextHide = null;
      }
      if(this.nextDestroy !== null){
        clearTimeout(this.nextDestroy);
        this.nextDestroy = null;
      }
  }

  /**
   * Start a new scan.
   *
   * The callback receives: (err, contents)
   */
  scan(callback) {
    //$log.debug('Scanning...');
    this.QRScanner.scan(callback);
  }

  pausePreview() {
    this.QRScanner.pausePreview();
  }

  resumePreview() {
    this.QRScanner.resumePreview();
  }

  /**
   * Deactivate the QRScanner. To balance user-perceived performance and power
   * consumption, this kicks off a countdown which will "sleep" the scanner
   * after a certain amount of time.
   *
   * The `status` of QRScanner is passed to the callback when deactivation
   * is complete.
   */
  deactivate() {
    //$log.debug('Deactivating scanner...');
    this.QRScanner.cancelScan();
    this.nextHide = setTimeout(this._hide, this.hideAfterSeconds * 1000);
    this.nextDestroy = setTimeout(this._destroy, this.destroyAfterSeconds * 1000);
  };

  // Natively hide the QRScanner's preview
  // On mobile platforms, this can reduce GPU/power usage
  // On desktop, this fully turns off the camera (and any associated privacy lights)
  _hide(){
    //$log.debug('Scanner not in use for ' + hideAfterSeconds + ' seconds, hiding...');
    this.QRScanner.hide();
  }

  // Reduce QRScanner power/processing consumption by the maximum amount
  _destroy(){
    //$log.debug('Scanner not in use for ' + destroyAfterSeconds + ' seconds, destroying...');
    this.QRScanner.destroy();
  }

  reinitialize(callback?) {
    this.initializeCompleted = false;
    this.QRScanner.destroy();
    this.initialize(callback);
  };

  /**
   * Toggle the device light (if available).
   *
   * The callback receives a boolean which is `true` if the light is enabled.
   */
  toggleLight(callback) {
    //$log.debug('Toggling light...');
    let _handleResponse = (err, status) => {
      if(err){
        //$log.error(err);
      } else {
        this.lightEnabled = status.lightEnabled;
        //let state = this.lightEnabled? 'enabled' : 'disabled';
        //$log.debug('Light ' + state + '.');
      }
      callback(this.lightEnabled);
    }
    if(this.lightEnabled){
      this.QRScanner.disableLight(_handleResponse);
    } else {
      this.QRScanner.enableLight(_handleResponse);
    }
  };

  /**
   * Switch cameras (if a second camera is available).
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */
  toggleCamera(callback) {
    let nextCamera = this.backCamera ? 1 : 0;
    // function cameraToString(index){
    //   return index === 1? 'front' : 'back'; // front = 1, back = 0
    // }
    //$log.debug('Toggling to the ' + cameraToString(nextCamera) + ' camera...');
    this.QRScanner.useCamera(nextCamera, function(err, status){
      if(err){
        //$log.error(err);
      }
      this.backCamera = status.currentCamera === 1? false : true;
      //$log.debug('Camera toggled. Now using the ' + cameraToString(backCamera) + ' camera.');
      callback(status);
    });
  };

  openSettings() {
    //$log.debug('Attempting to open device settings...');
    this.QRScanner.openSettings();
  };
}
