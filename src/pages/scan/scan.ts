import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { PlatformProvider } from '../../providers/platform/platform';
import { ScanProvider } from '../../providers/scan/scan';

// pages
import { IncomingDataMenuPage } from '../incoming-data-menu/incoming-data-menu';
import { PaperWalletPage } from '../paper-wallet/paper-wallet';
import { AmountPage } from '../send/amount/amount';
import { AddressbookAddPage } from '../settings/addressbook/add/add';

// import { QRScanner as QRScannerBrowser } from 'cordova-plugin-qrscanner/src/browser/src/library'

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
  providers: [ScanProvider]
})
export class ScanPage {

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
  public notSupportedMessage: string;
  public tabBarElement: any;
  // private qrScannerBrowser: QRScannerBrowser (inside constructor)
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
    if (this.navParams.data.fromAddressbook) {
      this.tabBarElement = document.querySelector('.tabbar.show-tabbar');
      this.tabBarElement.style.display = 'none';
    }
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ScanPage');
  }

  ionViewWillLeave() {
    // TODO support for browser
    if (!this.platform.isCordova) return;
    this.cameraToggleActive = false;
    this.lightActive = false;
    this.scanProvider.frontCameraEnabled = false;
    this.scanProvider.deactivate();
    this.events.unsubscribe('incomingDataMenu.showMenu');
    this.events.unsubscribe('scannerServiceInitialized');
    if (this.navParams.data.fromAddressbook) {
      this.tabBarElement.style.display = 'flex';
    }
  }

  ionViewWillEnter() {
    // TODO support for browser
    if (!this.platform.isCordova) {
      this.notSupportedMessage = this.translate.instant("Scanner not supported");
      return;
    }

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


    this.events.subscribe('incomingDataMenu.showMenu', (data) => {
      if (!this.modalIsOpen) {
        this.modalIsOpen = true;
        let modal = this.modalCtrl.create(IncomingDataMenuPage, data);
        modal.present();
        modal.onDidDismiss((data) => {
          this.modalIsOpen = false;
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
              this.activate();
          }
        });
      }
    });

    this.events.subscribe('scannerServiceInitialized', () => {
      this.logger.debug('Scanner initialization finished, reinitializing scan view...');
      this._refreshScanView();
    });

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
      this.scanProvider.scan().then((contents: string) => {
        this.logger.debug('Scan returned: "' + contents + '"');
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
    }
    else {
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
  };

  public toggleLight(): void {
    this.scanProvider.toggleLight()
      .then(resp => {
        this.lightActive = resp;
      })
      .catch(error => {
        this.logger.warn("scanner error: " + error);
      });
  }

  public toggleCamera(): void {
    this.scanProvider.toggleCamera()
      .then(resp => {
        this.cameraToggleActive = resp;
        this.lightActive = false;
      })
      .catch(error => {
        this.logger.warn("scanner error: " + error);
      });
  }

}
