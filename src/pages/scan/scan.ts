import { Component, VERSION, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Result } from '@zxing/library';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { PlatformProvider } from '../../providers/platform/platform';
import { ScanProvider } from '../../providers/scan/scan';

// pages
import { PaperWalletPage } from '../paper-wallet/paper-wallet';
import { AmountPage } from '../send/amount/amount';
import { AddressbookAddPage } from '../settings/addressbook/add/add';

import env from '../../environments';

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
  providers: [ScanProvider]
})
export class ScanPage {
  ngVersion = VERSION.full;

  @ViewChild('scanner') scanner: ZXingScannerComponent;

  hasCameras = false;
  hasPermission: boolean;
  qrResultString: string;

  availableDevices: MediaDeviceInfo[];
  selectedDevice: MediaDeviceInfo;

  public browserScanEnabled: boolean;
  private modalIsOpen: boolean;
  private scannerIsAvailable: boolean;
  private scannerHasPermission: boolean;
  private scannerIsDenied: boolean;
  private scannerIsRestricted: boolean;
  public canEnableLight: boolean;
  public canChangeCamera: boolean;
  public lightActive: boolean;
  public cameraToggleActive: boolean;
  public scannerStates: any;
  public canOpenSettings: boolean;
  public currentState: string;
  public tabBarElement: any;
  public isCordova: boolean;
  public isCameraSelected: boolean;

  constructor(
    private navCtrl: NavController,
    private scanProvider: ScanProvider,
    private platform: PlatformProvider,
    private incomingDataProvider: IncomingDataProvider,
    private events: Events,
    private modalCtrl: ModalController,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private translate: TranslateService,
    private navParams: NavParams
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
    this.modalIsOpen = false;
    this.scannerIsAvailable = true;
    this.scannerHasPermission = false;
    this.scannerIsDenied = false;
    this.scannerIsRestricted = false;
    this.canOpenSettings = false;
    this.isCordova = this.platform.isCordova;
    if (this.navParams.data.fromAddressbook) {
      this.tabBarElement = document.querySelector('.tabbar.show-tabbar');
      this.tabBarElement.style.display = 'none';
    }
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ScanPage');
  }

  ionViewWillLeave() {
    this.events.unsubscribe('finishIncomingDataMenuEvent');
    this.events.unsubscribe('scannerServiceInitialized');
    if (this.navParams.data.fromAddressbook) {
      this.tabBarElement.style.display = 'flex';
    }
    if (!this.isCordova) {
      this.scanner.resetScan();
    } else {
      this.cameraToggleActive = false;
      this.lightActive = false;
      this.scanProvider.frontCameraEnabled = false;
      this.scanProvider.deactivate();
    }
  }

  ionViewWillEnter() {
    if (!env.activateScanner) {
      // test scanner visibility in E2E mode
      this.selectedDevice = true as any;
      this.hasPermission = true;
      return;
    }

    this.events.subscribe('finishIncomingDataMenuEvent', data => {
      if (!this.isCordova) {
        this.scanner.resetScan();
      }
      switch (data.redirTo) {
        case 'AmountPage':
          this.sendPaymentToAddress(data.value, data.coin);
          break;
        case 'AddressBookPage':
          this.addToAddressBook(data.value);
          break;
        case 'OpenExternalLink':
          this.goToUrl(data.value);
          break;
        case 'PaperWalletPage':
          this.scanPaperWallet(data.value);
          break;
        default:
          if (this.isCordova) {
            this.activate();
          } else if (this.isCameraSelected) {
            this.scanner.startScan(this.selectedDevice);
          }
      }
    });

    if (!this.isCordova) {
      if (!this.isCameraSelected) {
        this.scanner.camerasFound.subscribe((devices: MediaDeviceInfo[]) => {
          this.hasCameras = true;
          this.availableDevices = devices;
          this.onDeviceSelectChange();
        });

        this.scanner.camerasNotFound.subscribe((devices: MediaDeviceInfo[]) => {
          // console.error('An error has occurred when trying to enumerate your video-stream-enabled devices.');
        });
        this.scanner.permissionResponse.subscribe((answer: boolean) => {
          this.hasPermission = answer;
        });
      } else {
        this.scanner.startScan(this.selectedDevice);
      }
    } else {
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
      this.events.subscribe('scannerServiceInitialized', () => {
        this.logger.debug(
          'Scanner initialization finished, reinitializing scan view...'
        );
        this._refreshScanView();
      });
    }
  }

  private goToUrl(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private sendPaymentToAddress(bitcoinAddress: string, coin: string): void {
    this.navCtrl.push(AmountPage, { toAddress: bitcoinAddress, coin });
  }

  private addToAddressBook(bitcoinAddress: string): void {
    this.navCtrl.push(AddressbookAddPage, { addressbookEntry: bitcoinAddress });
  }

  private scanPaperWallet(privateKey: string) {
    this.navCtrl.push(PaperWalletPage, { privateKey });
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
    this.scanProvider.activate().then(() => {
      this.updateCapabilities();
      this.handleCapabilities();
      this.logger.debug('Scanner activated, setting to visible...');
      this.currentState = this.scannerStates.visible;

      // resume preview if paused
      this.scanProvider.resumePreview();

      this.scanProvider.scan().then((contents: string) => {
        this.scanProvider.pausePreview();
        this.handleSuccessfulScan(contents);
      });
    });
  }

  private handleSuccessfulScan(contents: string): void {
    this.logger.debug('Scan returned: "' + contents + '"');
    let fromAddressbook = this.navParams.data.fromAddressbook;
    if (fromAddressbook) {
      this.events.publish('update:address', { value: contents });
      this.navCtrl.pop();
    } else {
      this.incomingDataProvider.redir(contents);
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
        this.logger.warn('scanner error: ' + error);
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
        this.logger.warn('scanner error: ' + error);
      });
  }

  handleQrCodeResult(resultString: string) {
    this.scanner.resetScan();
    setTimeout(() => {
      this.handleSuccessfulScan(resultString);
    }, 0);
  }

  onDeviceSelectChange() {
    if (!this.isCameraSelected) {
      for (const device of this.availableDevices) {
        if (device.kind == 'videoinput') {
          this.selectedDevice = this.scanner.getDeviceById(device.deviceId);
          this.isCameraSelected = true;
          break;
        }
      }
    }
  }
}
