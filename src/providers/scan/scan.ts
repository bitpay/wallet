import { Injectable } from '@angular/core';
import { QRScanner } from '@ionic-native/qr-scanner';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';

// Providers
import { ErrorsProvider } from '../errors/errors';
import { Logger } from '../logger/logger';
import { PlatformProvider } from '../platform/platform';

@Injectable()
export class ScanProvider {
  public text: string;
  public scannerVisible: boolean;
  public lightEnabled: boolean;
  public frontCameraEnabled: boolean;
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
    private events: Events,
    private translate: TranslateService,
    private errorsProvider: ErrorsProvider
  ) {
    this.scannerVisible = false;
    this.lightEnabled = false;
    this.frontCameraEnabled = false;
  }

  private checkCapabilities(status) {
    this.logger.info('scannerService is reviewing platform capabilities...');
    // Permission can be assumed on the desktop builds
    this.hasPermission = this.isDesktop || status.authorized ? true : false;
    this.isDenied = status.denied ? true : false;
    this.isRestricted = status.restricted ? true : false;
    this.canEnableLight = status.canEnableLight ? true : false;
    this.canChangeCamera = status.canChangeCamera ? true : false;
    this.canOpenSettings = status.canOpenSettings ? true : false;
    this.logCapabilities();
  }

  private orIsNot(bool: boolean): string {
    return bool ? '' : 'not ';
  }

  private logCapabilities() {
    this.logger.debug(
      'A camera is ' + this.orIsNot(this.isAvailable) + 'available to this app.'
    );
    var access = 'not authorized';
    if (this.hasPermission) access = 'authorized';
    if (this.isDenied) access = 'denied';
    if (this.isRestricted) access = 'restricted';
    this.logger.debug('Camera access is ' + access + '.');
    this.logger.debug(
      'Support for opening device settings is ' +
        this.orIsNot(this.canOpenSettings) +
        'available on this platform.'
    );
    this.logger.debug(
      'A light is ' +
        this.orIsNot(this.canEnableLight) +
        'available on this platform.'
    );
    this.logger.debug(
      'A second camera is ' +
        this.orIsNot(this.canChangeCamera) +
        'available on this platform.'
    );
  }

  /**
   * Immediately return known capabilities of the current platform.
   */
  public getCapabilities() {
    return {
      isAvailable: this.isAvailable,
      hasPermission: this.hasPermission,
      isDenied: this.isDenied,
      isRestricted: this.isRestricted,
      canEnableLight: this.canEnableLight,
      canChangeCamera: this.canChangeCamera,
      canOpenSettings: this.canOpenSettings
    };
  }

  /**
   * If camera access has been granted, pre-initialize the QRScanner. This method
   * can be safely called before the scanner is visible to improve perceived
   * scanner loading times.
   *
   * The `status` of QRScanner is returned to the callback.
   */
  public gentleInitialize(): Promise<any> {
    return new Promise(resolve => {
      if (this.initializeStarted && !this.isDesktop) {
        this.qrScanner.getStatus().then(status => {
          this.completeInitialization(status);
        });
        return resolve();
      }
      this.initializeStarted = true;
      this.logger.debug('Trying to pre-initialize QRScanner.');
      if (!this.isDesktop) {
        this.qrScanner.getStatus().then(status => {
          this.checkCapabilities(status);
          if (status.authorized) {
            this.logger.debug('Camera permission already granted.');
            this.initialize().then(() => {
              return resolve();
            });
          } else {
            this.logger.debug(
              'QRScanner not authorized, waiting to initalize.'
            );
            this.completeInitialization(status);
            return resolve();
          }
        });
      } else {
        this.logger.debug(
          'To avoid flashing the privacy light, we do not pre-initialize the camera on desktop.'
        );
        return resolve();
      }
    });
  }

  public reinitialize(): void {
    this.initializeCompleted = false;
    this.qrScanner.destroy();
    this.initialize();
  }

  public initialize(): Promise<any> {
    return new Promise(resolve => {
      this.logger.info('Initializing scanner...');
      this.qrScanner
        .prepare()
        .then(status => {
          this.completeInitialization(status);
          return resolve();
        })
        .catch(err => {
          this.isAvailable = false;
          this.logger.error(err);
          if (err && err.name === 'CAMERA_ACCESS_DENIED') {
            const msg = this.translate.instant(
              'Check the app camera permissions under your phone settings'
            );
            const title = this.translate.instant('Camera access denied');
            this.errorsProvider.showDefaultError(msg, title);
          }
          // does not return `status` if there is an error
          this.qrScanner.getStatus().then(status => {
            this.completeInitialization(status);
            return resolve();
          });
        });
    });
  }

  private completeInitialization(status): void {
    this.checkCapabilities(status);
    this.initializeCompleted = true;
    this.events.publish('scannerServiceInitialized');
  }

  public isInitialized(): boolean {
    return this.initializeCompleted;
  }
  public isInitializeStarted(): boolean {
    return this.initializeStarted;
  }

  /**
   * (Re)activate the QRScanner, and cancel the timeouts if present.
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */
  public activate(): Promise<any> {
    return new Promise(resolve => {
      this.logger.info('Activating scanner...');
      this.qrScanner.show().then(status => {
        this.initializeCompleted = true;
        this.checkCapabilities(status);
        return resolve();
      });
    });
  }
  /**
   * Start a new scan.
   */
  public scan(): Promise<any> {
    return new Promise(resolve => {
      this.logger.info('Scanning...');
      let scanSub = this.qrScanner.scan().subscribe((text: string) => {
        this.logger.debug('Scan success');
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

  public deactivate(): void {
    this.logger.info('Deactivating scanner...');
    if (this.lightEnabled) {
      this.qrScanner.disableLight();
      this.lightEnabled = false;
    }
    this.hide();
    this.destroy();
  }

  // Natively hide the QRScanner's preview
  // On mobile platforms, this can reduce GPU/power usage
  // On desktop, this fully turns off the camera (and any associated privacy lights)
  private hide() {
    this.qrScanner.hide();
  }

  // Reduce QRScanner power/processing consumption by the maximum amount
  private destroy() {
    this.qrScanner.destroy();
  }

  /**
   * Toggle the device light (if available).
   *
   * The callback receives a boolean which is `true` if the light is enabled.
   */

  public toggleLight(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Toggling light...');
      if (this.lightEnabled) {
        this.qrScanner
          .disableLight()
          .then(() => {
            this.lightEnabled = false;
            return resolve(this.lightEnabled);
          })
          .catch(err => {
            this.logger.error('Scan Provider Error (disableLight)', err);
            return reject(err);
          });
      } else {
        this.qrScanner
          .enableLight()
          .then(() => {
            this.lightEnabled = true;
            return resolve(this.lightEnabled);
          })
          .catch(err => {
            this.logger.error('Scan Provider Error (enableLight)', err);
            return reject(err);
          });
      }
    });
  }

  /**
   * Switch cameras (if a second camera is available).
   *
   * The `status` of QRScanner is passed to the callback when activation
   * is complete.
   */

  public toggleCamera(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Toggling camera...');
      if (this.frontCameraEnabled) {
        this.qrScanner
          .useBackCamera()
          .then(() => {
            this.frontCameraEnabled = false;
            return resolve(this.frontCameraEnabled);
          })
          .catch(err => {
            this.logger.error('Scan Provider Error (useBackCamera)', err);
            return reject(err);
          });
      } else {
        this.qrScanner
          .useFrontCamera()
          .then(() => {
            this.frontCameraEnabled = true;
            return resolve(this.frontCameraEnabled);
          })
          .catch(err => {
            this.logger.error('Scan Provider Error (useFrontCamera)', err);
            return reject(err);
          });
      }
    });
  }

  public openSettings(): void {
    this.logger.info('Attempting to open device settings...');
    this.qrScanner.openSettings();
  }
}
