import { Injectable } from '@angular/core';
import { PlatformInfo } from './platform-info.service';
import QRScanner from 'cordova-plugin-qrscanner/dist/cordova-plugin-qrscanner-lib.min.js';

@Injectable()
export class ScannerService {
  win: any = window;
  isDesktop: boolean = false;
  lightEnabled: boolean = false;
  backCamera: boolean = true; // the plugin defaults to the back camera

  // Initalize known capabilities
  isAvailable: Boolean = false;
  hasPermission: boolean = false;
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
    this.isDesktop = !platformInfo.isCordova;
    this.isAvailable = this.isDesktop ? false : true; // assume camera exists on mobile
    this.hasPermission = this.isDesktop ? true: false; // assume desktop has permission
  }

  _checkCapabilities(status){
    console.log('scannerService is reviewing platform capabilities...');
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
    let _orIsNot = (bool) => {
      return bool? '' : 'not ';
    };
    console.log('A camera is ' + _orIsNot(this.isAvailable) + 'available to this app.');
    let access = 'not authorized';
    if(this.hasPermission) access = 'authorized';
    if(this.isDenied) access = 'denied';
    if(this.isRestricted) access = 'restricted';
    console.log('Camera access is ' + access + '.');
    console.log('Support for opening device settings is ' + _orIsNot(this.canOpenSettings) + 'available on this platform.');
    console.log('A light is ' + _orIsNot(this.canEnableLight) + 'available on this platform.');
    console.log('A second camera is ' + _orIsNot(this.canChangeCamera) + 'available on this platform.');
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

  /**
   * If camera access has been granted, pre-initialize the QRScanner. This method
   * can be safely called before the scanner is visible to improve perceived
   * scanner loading times.
   *
   * The `status` of QRScanner is returned to the callback.
   */
  gentleInitialize(callback?) {
    if(this.initializeStarted){
      QRScanner.getStatus((status) => {
        this._completeInitialization(status, callback);
      });
      return;
    }
    this.initializeStarted = true;
    console.log('Trying to pre-initialize QRScanner.');
    if(!this.isDesktop){
      QRScanner.getStatus((status) => {
        this._checkCapabilities(status);
        if(status.authorized){
          console.log('Camera permission already granted.');
          this.initialize(callback);
        } else {
          console.log('QRScanner not authorized, waiting to initalize.');
          this._completeInitialization(status, callback);
        }
      });
    } else {
      console.log('Camera permission assumed on desktop.');
      this.initialize(callback);
    }
  };

  initialize(callback){
    console.log('Initializing scanner...');
    QRScanner.prepare((err, status) => {
      if(err){
        console.error(err);
        // does not return `status` if there is an error
        QRScanner.getStatus((status) => {
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

  /**
   * (Re)activate the QRScanner, and cancel the timeouts if present.
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */
  activate(callback) {
    console.log('Activating scanner...');
    QRScanner.show((status) => {
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
    console.log('Scanning...');
    QRScanner.scan(callback);
  }

  pausePreview() {
    QRScanner.pausePreview();
  }

  resumePreview() {
    QRScanner.resumePreview();
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
    console.log('Deactivating scanner...');
    QRScanner.cancelScan();
    this.nextHide = setTimeout(this._hide, this.hideAfterSeconds * 1000);
    this.nextDestroy = setTimeout(this._destroy, this.destroyAfterSeconds * 1000);
  };

  // Natively hide the QRScanner's preview
  // On mobile platforms, this can reduce GPU/power usage
  // On desktop, this fully turns off the camera (and any associated privacy lights)
  _hide(){
    console.log('Scanner not in use for ' + this.hideAfterSeconds + ' seconds, hiding...');
    QRScanner.hide();
  }

  // Reduce QRScanner power/processing consumption by the maximum amount
  _destroy(){
    console.log('Scanner not in use for ' + this.destroyAfterSeconds + ' seconds, destroying...');
    QRScanner.destroy();
  }

  reinitialize(callback?) {
    this.initializeCompleted = false;
    QRScanner.destroy();
    this.initialize(callback);
  };

  /**
   * Toggle the device light (if available).
   *
   * The callback receives a boolean which is `true` if the light is enabled.
   */
  toggleLight(callback) {
    console.log('Toggling light...');
    let _handleResponse = (err, status) => {
      if(err){
        console.error(err);
      } else {
        this.lightEnabled = status.lightEnabled;
        let state = this.lightEnabled? 'enabled' : 'disabled';
        console.log('Light ' + state + '.');
      }
      callback(this.lightEnabled);
    }
    if(this.lightEnabled){
      QRScanner.disableLight(_handleResponse);
    } else {
      QRScanner.enableLight(_handleResponse);
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
    let cameraToString = (index) => {
      return index === 1? 'front' : 'back'; // front = 1, back = 0
    }
    console.log('Toggling to the ' + cameraToString(nextCamera) + ' camera...');
    QRScanner.useCamera(nextCamera, (err, status) => {
      if(err){
        console.error(err);
      }
      this.backCamera = status.currentCamera === 1? false : true;
      console.log('Camera toggled. Now using the ' + cameraToString(this.backCamera) + ' camera.');
      callback(status);
    });
  };

  openSettings() {
    console.log('Attempting to open device settings...');
    QRScanner.openSettings();
  };
}
