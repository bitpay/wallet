import { Injectable } from '@angular/core';
import { QRScanner } from '@ionic-native/qr-scanner';
import { PlatformProvider } from '../platform/platform';
import { Logger } from '@nsalaun/ng-logger';
import { Events } from 'ionic-angular';

@Injectable()
export class ScanProvider {

  public text: string;
  public scannerVisible: boolean;
  public lightEnabled: boolean;
  public frontCameraEnabled: boolean;
  public nextHide: any = null;
  public nextDestroy: any = null;
  public hideAfterSeconds: number;
  public destroyAfterSeconds: number;
  private scanSub: any;
  public isDesktop = !this.platform.isCordova;
  public isAvailable: boolean = true;
  public hasPermission: boolean = false;
  public isDenied: boolean = false;
  public isRestricted: boolean = false;
  public canEnableLight: boolean = false;
  public canChangeCamera: boolean = false;
  public canOpenSettings: boolean = false;
  public backCamera: boolean = true;
  public initializeStarted: boolean = false;
  public initializeCompleted: boolean = false;

  constructor(
    private qrScanner: QRScanner,
    private platform: PlatformProvider,
    private logger: Logger,
    private events: Events
  ) {
    this.scannerVisible = false;
    this.lightEnabled = false;
    this.frontCameraEnabled = false;
    this.hideAfterSeconds = 5;
    this.destroyAfterSeconds = 60;
  }

  private _checkCapabilities(status) {
    this.logger.debug('scannerService is reviewing platform capabilities...');
    // Permission can be assumed on the desktop builds
    this.hasPermission = (this.isDesktop || status.authorized) ? true : false;
    this.isDenied = status.denied ? true : false;
    this.isRestricted = status.restricted ? true : false;
    this.canEnableLight = status.canEnableLight ? true : false;
    this.canChangeCamera = status.canChangeCamera ? true : false;
    this.canOpenSettings = status.canOpenSettings ? true : false;
    this._logCapabilities();
  }

  private _orIsNot(bool: boolean): string {
    return bool ? '' : 'not ';
  }

  private _logCapabilities() {

    this.logger.debug('A camera is ' + this._orIsNot(this.isAvailable) + 'available to this app.');
    var access = 'not authorized';
    if (this.hasPermission) access = 'authorized';
    if (this.isDenied) access = 'denied';
    if (this.isRestricted) access = 'restricted';
    this.logger.debug('Camera access is ' + access + '.');
    this.logger.debug('Support for opening device settings is ' + this._orIsNot(this.canOpenSettings) + 'available on this platform.');
    this.logger.debug('A light is ' + this._orIsNot(this.canEnableLight) + 'available on this platform.');
    this.logger.debug('A second camera is ' + this._orIsNot(this.canChangeCamera) + 'available on this platform.');
  }

  /**
 * Immediately return known capabilities of the current platform.
 */
  public getCapabilities(): any {
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
  public gentleInitialize(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.initializeStarted && !this.isDesktop) {
        this.qrScanner.getStatus().then((status) => {
          this._completeInitialization(status);
        });
        return;
      }
      this.initializeStarted = true;
      this.logger.debug('Trying to pre-initialize QRScanner.');
      if (!this.isDesktop) {
        this.qrScanner.getStatus().then((status) => {
          this._checkCapabilities(status);
          if (status.authorized) {
            this.logger.debug('Camera permission already granted.');
            this.initialize();
          } else {
            this.logger.debug('QRScanner not authorized, waiting to initalize.');
            this._completeInitialization(status);
          }
        });
      } else {
        this.logger.debug('To avoid flashing the privacy light, we do not pre-initialize the camera on desktop.');
      }
    });
  };

  public reinitialize(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.initializeCompleted = false;
      this.qrScanner.destroy();
      this.initialize();
    });
  };

  public initialize(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Initializing scanner...');
      this.qrScanner.prepare().then((status: any) => {
        this._completeInitialization(status);
      }).catch((err) => {
        this.isAvailable = false;
        this.logger.error(err);
        // does not return `status` if there is an error
        this.qrScanner.getStatus().then((status) => {
          this._completeInitialization(status);
        });
      });
    });
  }

  private _completeInitialization(status: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this._checkCapabilities(status);
      this.initializeCompleted = true;
      this.events.publish('scannerServiceInitialized');
      resolve(status);
    });
  }

  public isInitialized(): boolean {
    return this.initializeCompleted;
  };

  public isInitializeStarted(): boolean {
    return this.initializeStarted;
  };

  /**
   * (Re)activate the QRScanner, and cancel the timeouts if present.
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */
  public activate(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Activating scanner...');
      this.qrScanner.show().then((status) => {
        this.initializeCompleted = true;
        this._checkCapabilities(status);
        return resolve(status);
      });
      if (this.nextHide !== null) {
        this.nextHide.cancel();
        this.nextHide = null;
      }
      if (this.nextDestroy !== null) {
        this.nextDestroy.cancel();
        this.nextDestroy = null;
      }
    });
  }

  /**
  * Start a new scan.
  *
  */
  public scan(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Scanning...');
      let scanSub = this.qrScanner.scan().subscribe((text: string) => {
        console.log('Scanned something', text);
        this.qrScanner.hide(); // hide camera preview
        scanSub.unsubscribe(); // stop scanning
        return resolve(text);
      });
    });
  }

  public pausePreview(): void {
    this.qrScanner.pausePreview();
  }

  public resumePreview(): void {
    this.qrScanner.resumePreview();
  }


  /**
 * Deactivate the QRScanner. To balance user-perceived performance and power
 * consumption, this kicks off a countdown which will "sleep" the scanner
 * after a certain amount of time.
 *
 * The `status` of QRScanner is passed to the callback when deactivation
 * is complete.
 */

  public deactivate(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Deactivating scanner...');
      if (this.lightEnabled) {
        this.qrScanner.disableLight();
        this.lightEnabled = false;
      }
      setTimeout(() => {
        this._hide();
      }, this.hideAfterSeconds);
      setTimeout(() => {
        this._destroy();
      }, this.destroyAfterSeconds);
      return resolve();
    });
  }

  // Natively hide the QRScanner's preview
  // On mobile platforms, this can reduce GPU/power usage
  // On desktop, this fully turns off the camera (and any associated privacy lights)
  private _hide() {
    this.logger.debug('Scanner not in use for ' + this.hideAfterSeconds + ' seconds, hiding...');
    this.qrScanner.hide();
  }

  // Reduce QRScanner power/processing consumption by the maximum amount
  private _destroy() {
    this.logger.debug('Scanner not in use for ' + this.destroyAfterSeconds + ' seconds, destroying...');
    this.qrScanner.destroy();
  }

  /**
 * Toggle the device light (if available).
 *
 * The callback receives a boolean which is `true` if the light is enabled.
 */

  public toggleLight(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Toggling light...');
      if (this.lightEnabled) {
        this.qrScanner.disableLight()
          .then(resp => {
            this.lightEnabled = false;
            return resolve(this.lightEnabled);
          })
          .catch(err => {
            console.log("Error: ", err);
            return reject(err);
          });
      } else {
        this.qrScanner.enableLight()
          .then(resp => {
            this.lightEnabled = true;
            return resolve(this.lightEnabled);
          })
          .catch(err => {
            console.log("Error: ", err);
            return reject(err);
          });
      }
    });
  };

  /**
   * Switch cameras (if a second camera is available).
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */

  public toggleCamera(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Toggling camera...');
      if (this.frontCameraEnabled) {
        this.qrScanner.useBackCamera()
          .then(resp => {
            this.frontCameraEnabled = false;
            return resolve(this.frontCameraEnabled);
          })
          .catch(err => {
            console.log("Error: ", err);
            return reject(err);
          });
      } else {
        this.qrScanner.useFrontCamera()
          .then(resp => {
            this.frontCameraEnabled = true;
            return resolve(this.frontCameraEnabled);
          })
          .catch(err => {
            console.log("Error: ", err);
            return reject(err);
          });
      }
    });
  }

  public openSettings(): void {
    this.logger.debug('Attempting to open device settings...');
    this.qrScanner.openSettings();
  }

}
