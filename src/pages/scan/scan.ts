import { Component } from '@angular/core';
import { NavController, Events, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { PlatformProvider } from '../../providers/platform/platform';
import { ScanProvider } from '../../providers/scan/scan';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';

//pages
import { AmountPage } from '../send/amount/amount';
import { IncomingDataMenuPage } from '../incoming-data-menu/incoming-data-menu';
import { AddressbookAddPage } from '../settings/addressbook/add/add';
import { PaperWalletPage } from '../paper-wallet/paper-wallet';

//import { QRScanner as QRScannerBrowser } from 'cordova-plugin-qrscanner/src/browser/src/library'

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
  // private qrScannerBrowser: QRScannerBrowser (inside constructor)
  constructor(
    private navCtrl: NavController,
    private scanProvider: ScanProvider,
    private platform: PlatformProvider,
    private incomingDataProvider: IncomingDataProvider,
    private events: Events,
    private modalCtrl: ModalController,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger
  ) {
    this.lightActive = false;
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
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScanPage');
  }

  ionViewWillLeave() {
    //TODO support for browser
    if (!this.platform.isCordova) return;
    this.scanProvider.deactivate();
  }

  ionViewDidEnter() {
    //TODO support for browser
    if (!this.platform.isCordova) return;
    // try initializing and refreshing status any time the view is entered
    if (!this.scanProvider.isInitialized()) {
      this.scanProvider.gentleInitialize();
    }
    this.activate();

    this.events.subscribe('incomingDataMenu.showMenu', (data) => {
      if (!this.modalIsOpen) {
        this.modalIsOpen = true;
        let modal = this.modalCtrl.create(IncomingDataMenuPage, data);
        modal.present();
        modal.onDidDismiss((data) => {
          this.modalIsOpen = false;
          switch (data.redirTo) {
            case 'AmountPage':
              this.sendPaymentToAddress(data.value);
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

  private sendPaymentToAddress(bitcoinAddress: string): void {
    //this.navCtrl.parent.select(3); TODO go to send and then amount page
    this.navCtrl.push(AmountPage, { toAddress: bitcoinAddress });
  }

  private addToAddressBook(bitcoinAddress: string): void {
    //this.navCtrl.parent.select(4); TODO go to settings, addressbook and then addressbook add
    this.navCtrl.push(AddressbookAddPage, { addressbookEntry: bitcoinAddress });
  }

  private scanPaperWallet(privateKey: string) {
    //this.navCtrl.parent.select(0); TODO go to home and then paperwallet page
    this.navCtrl.push(PaperWalletPage, { privateKey: privateKey });
  }

  private _updateCapabilities(): void {
    let capabilities = this.scanProvider.getCapabilities();
    this.scannerIsAvailable = capabilities.isAvailable;
    this.scannerHasPermission = capabilities.hasPermission;
    this.scannerIsDenied = capabilities.isDenied;
    this.scannerIsRestricted = capabilities.isRestricted;
    this.canEnableLight = capabilities.canEnableLight;
    this.canChangeCamera = capabilities.canChangeCamera;
    this.canOpenSettings = capabilities.canOpenSettings;
  }

  private _handleCapabilities(): void {
    // always update the view
    setTimeout(() => {
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
    });
  }

  private _refreshScanView(): void {
    this._updateCapabilities();
    this._handleCapabilities();
    if (this.scannerHasPermission) {
      this.activate();
    }
  }

  public activate(): void {
    this.scanProvider.activate().then(() => {
      this._updateCapabilities();
      this._handleCapabilities();
      this.logger.debug('Scanner activated, setting to visible...');
      this.currentState = this.scannerStates.visible;
      // pause to update the view
      setTimeout(() => {
        this.scanProvider.scan().then((contents: string) => {
          this.logger.debug('Scan returned: "' + contents + '"');
          //if (this.navParams.data.passthroughMode) {
          //TODO $rootScope.scanResult = contents;
          //goBack();
          //} else {
          this.handleSuccessfulScan(contents);
          //}
        });
        // resume preview if paused
        this.scanProvider.resumePreview();
      });
    });
  }

  private handleSuccessfulScan(contents: string): void {
    this.logger.debug('Scan returned: "' + contents + '"');
    this.scanProvider.pausePreview();
    this.incomingDataProvider.redir(contents);
  }

  public authorize(): void {
    this.scanProvider.initialize().then(() => {
      this._refreshScanView();
    });
  };

  public attemptToReactivate(): void {
    this.scanProvider.reinitialize();
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
      })
      .catch(error => {
        this.logger.warn("scanner error: " + error);
      });
  }

}
