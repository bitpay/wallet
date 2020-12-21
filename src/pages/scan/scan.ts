import { Component, VERSION } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams, Platform } from 'ionic-angular';

// providers
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ErrorsProvider } from '../../providers/errors/errors';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../../providers/platform/platform';
import { ScanProvider } from '../../providers/scan/scan';

import env from '../../environments';

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
  providers: [ScanProvider]
})
export class ScanPage {
  ngVersion = VERSION.full;

  hasCameras = false;
  hasPermission: boolean;
  qrResultString: string;

  availableDevices: MediaDeviceInfo[];
  selectedDevice: MediaDeviceInfo;

  public browserScanEnabled: boolean;
  private scannerIsAvailable: boolean;
  private scannerHasPermission: boolean;
  private scannerIsDenied: boolean;
  private scannerIsRestricted: boolean;
  private unregisterBackButtonAction;
  public canEnableLight: boolean;
  public canChangeCamera: boolean;
  public lightActive: boolean;
  public cameraToggleActive: boolean;
  public scannerStates;
  public canOpenSettings: boolean;
  public currentState: string;
  public isCordova: boolean;
  public isCameraSelected: boolean;
  public fromAddressbook: boolean;
  public fromImport: boolean;
  public fromJoin: boolean;
  public fromSend: boolean;
  public fromMultiSend: boolean;
  public fromSelectInputs: boolean;
  public fromEthMultisig: boolean;
  public fromConfirm: boolean;
  public fromWalletConnect: boolean;
  public canGoBack: boolean;
  public tabBarElement;

  constructor(
    private navCtrl: NavController,
    private scanProvider: ScanProvider,
    private platformProvider: PlatformProvider,
    private incomingDataProvider: IncomingDataProvider,
    private events: Events,
    private logger: Logger,
    public translate: TranslateService,
    private navParams: NavParams,
    private platform: Platform,
    private errorsProvider: ErrorsProvider,
    private bwcErrorProvider: BwcErrorProvider
  ) {
    this.isCameraSelected = false;
    this.browserScanEnabled = false;
    this.canEnableLight = true;
    this.canChangeCamera = true;
    this.scannerStates = {
      unauthorized: 'unauthorized',
      denied: 'denied',
      unavailable: 'unavailable',
      loading: 'loading',
      visible: 'visible'
    };
    this.scannerIsAvailable = true;
    this.scannerHasPermission = false;
    this.scannerIsDenied = false;
    this.scannerIsRestricted = false;
    this.canOpenSettings = false;
    this.isCordova = this.platformProvider.isCordova;
    this.tabBarElement = document.querySelector('.tabbar.show-tabbar');
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ScanPage');
    this.navCtrl.swipeBackEnabled = false;
    this.canGoBack = this.navCtrl.canGoBack();
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
    this.events.unsubscribe('incomingDataError', this.incomingDataErrorHandler);
    this.events.unsubscribe(
      'scannerServiceInitialized',
      this.scannerServiceInitializedHandler
    );

    this.cameraToggleActive = false;
    this.lightActive = false;
    this.scanProvider.frontCameraEnabled = false;
    this.scanProvider.deactivate();
    this.unregisterBackButtonAction && this.unregisterBackButtonAction();
    this.tabBarElement.style.display = 'flex';
  }

  ionViewWillEnter() {
    this.initializeBackButtonHandler();
    this.fromAddressbook = this.navParams.data.fromAddressbook;
    this.fromImport = this.navParams.data.fromImport;
    this.fromJoin = this.navParams.data.fromJoin;
    this.fromSend = this.navParams.data.fromSend;
    this.fromMultiSend = this.navParams.data.fromMultiSend;
    this.fromSelectInputs = this.navParams.data.fromSelectInputs;
    this.fromEthMultisig = this.navParams.data.fromEthMultisig;
    this.fromConfirm = this.navParams.data.fromConfirm;
    this.fromWalletConnect = this.navParams.data.fromWalletConnect;

    if (this.canGoBack) this.tabBarElement.style.display = 'none';

    if (!env.activateScanner) {
      // test scanner visibility in E2E mode
      this.selectedDevice = true as any;
      this.hasPermission = true;
      return;
    }

    this.events.subscribe('incomingDataError', this.incomingDataErrorHandler);

    // try initializing and refreshing status any time the view is entered
    if (this.scannerHasPermission) {
      this.activate();
    } else {
      if (!this.scanProvider.isInitialized()) {
        this.scanProvider.gentleInitialize().then(() => {
          this.authorize();
        });
      } else {
        this.authorize();
      }
    }
    this.events.subscribe(
      'scannerServiceInitialized',
      this.scannerServiceInitializedHandler
    );
  }

  private incomingDataErrorHandler: any = err => {
    this.showErrorInfoSheet(err);
  };

  private scannerServiceInitializedHandler: any = () => {
    this.logger.debug(
      'Scanner initialization finished, reinitializing scan view...'
    );
    this._refreshScanView();
  };

  private showErrorInfoSheet(error: Error | string, title?: string): void {
    let infoSheetTitle = title ? title : this.translate.instant('Error');
    this.errorsProvider.showDefaultError(
      this.bwcErrorProvider.msg(error),
      infoSheetTitle,
      () => {
        this.activate();
      }
    );
  }

  private initializeBackButtonHandler(): void {
    this.unregisterBackButtonAction = this.platform.registerBackButtonAction(
      () => {
        this.closeCam();
      }
    );
  }

  private updateCapabilities(): void {
    let capabilities = this.scanProvider.getCapabilities();
    this.scannerIsAvailable = capabilities.isAvailable;
    this.scannerHasPermission = capabilities.hasPermission;
    this.scannerIsDenied = capabilities.isDenied;
    this.scannerIsRestricted = capabilities.isRestricted;
    this.canEnableLight = capabilities.canEnableLight;
    this.canChangeCamera = capabilities.canChangeCamera;
    this.canOpenSettings = capabilities.canOpenSettings;
  }

  private handleCapabilities(): void {
    // always update the view
    if (!this.scanProvider.isInitialized()) {
      this.currentState = this.scannerStates.loading;
    } else if (!this.scannerIsAvailable) {
      this.currentState = this.scannerStates.unavailable;
    } else if (this.scannerIsDenied) {
      this.currentState = this.scannerStates.denied;
    } else if (this.scannerIsRestricted) {
      this.currentState = this.scannerStates.denied;
    } else if (!this.scannerHasPermission) {
      this.currentState = this.scannerStates.unauthorized;
    }
    this.logger.debug('Scan view state set to: ' + this.currentState);
  }

  private _refreshScanView(): void {
    this.updateCapabilities();
    this.handleCapabilities();
    if (this.scannerHasPermission) {
      this.activate();
    }
  }

  public activate(): void {
    this.scanProvider
      .activate()
      .then(() => {
        this.logger.info('Scanner activated, setting to visible...');
        this.updateCapabilities();
        this.handleCapabilities();
        this.currentState = this.scannerStates.visible;

        // resume preview if paused
        this.scanProvider.resumePreview();

        this.scanProvider.scan().then((contents: string) => {
          this.scanProvider.pausePreview();
          this.handleSuccessfulScan(contents);
        });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  private handleSuccessfulScan(contents: string): void {
    if (this.canGoBack) this.navCtrl.pop({ animate: false });

    if (this.fromAddressbook) {
      this.events.publish('Local/AddressScan', { value: contents });
    } else if (this.fromImport) {
      this.events.publish('Local/BackupScan', { value: contents });
    } else if (this.fromJoin) {
      this.events.publish('Local/JoinScan', { value: contents });
    } else if (this.fromSend) {
      this.events.publish('Local/AddressScan', { value: contents });
    } else if (this.fromMultiSend) {
      this.events.publish('Local/AddressScanMultiSend', { value: contents });
    } else if (this.fromSelectInputs) {
      this.events.publish('Local/AddressScanSelectInputs', { value: contents });
    } else if (this.fromEthMultisig) {
      this.events.publish('Local/AddressScanEthMultisig', { value: contents });
    } else if (this.fromConfirm) {
      this.events.publish('Local/TagScan', { value: contents });
    } else if (this.fromWalletConnect) {
      this.events.publish('Local/UriScan', { value: contents });
    } else {
      const redirParms = { activePage: 'ScanPage' };
      this.incomingDataProvider.redir(contents, redirParms);
    }
  }

  public authorize(): void {
    this.scanProvider.initialize().then(() => {
      this._refreshScanView();
    });
  }

  public attemptToReactivate(): void {
    this.scanProvider.reinitialize();
  }

  public openSettings(): void {
    this.scanProvider.openSettings();
  }

  public toggleLight(): void {
    this.scanProvider
      .toggleLight()
      .then(resp => {
        this.lightActive = resp;
      })
      .catch(error => {
        this.logger.warn('scanner error: ' + JSON.stringify(error));
      });
  }

  public toggleCamera(): void {
    this.scanProvider
      .toggleCamera()
      .then(resp => {
        this.cameraToggleActive = resp;
        this.lightActive = false;
      })
      .catch(error => {
        this.logger.warn('scanner error: ' + JSON.stringify(error));
      });
  }

  public closeCam() {
    this.navCtrl.pop({ animate: false });
  }
}
