import { Component, Optional, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';
// providers
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ErrorsProvider } from '../../providers/errors/errors';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../../providers/platform/platform';
import { ScanProvider } from '../../providers/scan/scan';

import env from '../../../environments';
import { IonRouterOutlet, NavController, NavParams, Platform } from '@ionic/angular';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';
import _ from 'lodash';
import { PreviousRouteService } from 'src/app/providers/previous-route/previous-route';
import { ActionSheetProvider } from 'src/app/providers/action-sheet/action-sheet';
import { AddressProvider } from 'src/app/providers/address/address';

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
  styleUrls: ['./scan.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ScanProvider]
})
export class ScanPage {
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
  public fromRecipientComponent: boolean;
  public recipientId: string;
  public fromMultiSend: boolean;
  public fromSelectInputs: boolean;
  public fromEthMultisig: boolean;
  public fromConfirm: boolean;
  public fromWalletConnect: boolean;
  public fromFooterMenu: boolean;
  public canGoBack: boolean;
  public tabBarElement;
  navParamsData
  constructor(
    private navCtrl: NavController,
    private scanProvider: ScanProvider,
    private platformProvider: PlatformProvider,
    private incomingDataProvider: IncomingDataProvider,
    private events: EventManagerService,
    private logger: Logger,
    public translate: TranslateService,
    private navParams: NavParams,
    private platform: Platform,
    private errorsProvider: ErrorsProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private router: Router,
    private location: Location,
    private routerOutlet: IonRouterOutlet,
    private previousRouteService: PreviousRouteService,
    private actionSheetProvider: ActionSheetProvider,
    private addressProvider: AddressProvider
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    if (_.isEmpty(this.navParamsData) && this.navParams && !_.isEmpty(this.navParams.data)) this.navParamsData = this.navParams.data;
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

  ngOnInit() {
    this.logger.info('Loaded: ScanPage');
    this.routerOutlet.swipeGesture = false;
    this.canGoBack = this.routerOutlet && this.routerOutlet.canGoBack();

  }

  ionViewWillLeave() {
    this.routerOutlet.swipeGesture = true;
    this.events.unsubscribe('incomingDataError', this.incomingDataErrorHandler);
    this.events.unsubscribe(
      'scannerServiceInitialized',
      this.scannerServiceInitializedHandler
    );

    this.scannerHasPermission = false;
    this.cameraToggleActive = false;
    this.lightActive = false;
    this.scanProvider.frontCameraEnabled = false;
    this.scanProvider.deactivate();
    this.unregisterBackButtonAction && this.unregisterBackButtonAction();
    this.tabBarElement.style.display = 'flex';
  }

  ionViewWillEnter() {
    this.fromAddressbook = this.navParamsData.fromAddressbook;
    this.fromImport = this.navParamsData.fromImport;
    this.fromJoin = this.navParamsData.fromJoin;
    this.fromRecipientComponent = this.navParamsData.fromRecipientComponent;
    this.recipientId = this.navParamsData.recipientId;
    this.fromMultiSend = this.navParamsData.fromMultiSend;
    this.fromSelectInputs = this.navParamsData.fromSelectInputs;
    this.fromEthMultisig = this.navParamsData.fromEthMultisig;
    this.fromConfirm = this.navParamsData.fromConfirm;
    this.fromWalletConnect = this.navParamsData.fromWalletConnect;
    this.fromFooterMenu = this.navParamsData.fromFooterMenu;

    if (this.canGoBack && this.tabBarElement)
      this.tabBarElement.style.display = 'none';

    if (!env.activateScanner) {
      this.logger.debug('Scanner page: env.activateScanner = false');
      return;
    }

    this.events.subscribe('incomingDataError', this.incomingDataErrorHandler);

    // try initializing and refreshing status any time the view is entered
    if (this.scannerHasPermission) {
      this.logger.debug('scannerHasPermission: true');
      this.activate();
    } else {
      this.logger.debug('scannerHasPermission: false');
      if (!this.scanProvider.isInitialized()) {
        this.logger.debug('Scanner trying to initialize');
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


  private showErrorInvalidQr(error: Error | string, title?: string): void {
    let infoSheetTitle = title
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'invalid-qr',
      { msg: error, title: infoSheetTitle }
    );
    errorInfoSheet.present();
    errorInfoSheet.onDidDismiss(option => {
      if (option) {
        this.router.navigate(['/tabs/scan'])
      }
    });
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
    if (this.canGoBack) this.location.back();
    if (this.fromAddressbook) {
      this.events.publish('Local/AddressScan', { value: contents });
    } else if (this.fromImport) {
      this.events.publish('Local/BackupScan', { value: contents });
    } else if (this.fromJoin) {
      this.events.publish('Local/JoinScan', { value: contents });
    } else if (this.fromRecipientComponent) {
      this.events.publish('Local/AddressScan', { value: contents, recipientId: this.recipientId });
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
    } else if (this.fromFooterMenu) {
      const redirParms = {
        activePage: 'ScanPage',
        fromFooterMenu: this.fromFooterMenu
      };
      this.incomingDataProvider.redir(contents, redirParms);
    } else {
      this.router.navigate(['/tabs/home']).then(() => {
        this.redirScanAddress(contents);
      });

    }
  }


  private handleSendAddress(data, addrData): void {
    if (data.data.includes('amount')) {
      this.router.navigateByUrl('/accounts-page', {
        state: {
          coin: addrData.coin,
          network: addrData.network,
          toAddress: data.data,
          isSpecificAmount: true
        }
      });
    }
    else {
      const dataMenu = this.actionSheetProvider.createIncomingDataMenu({ data });
      dataMenu.present();
      dataMenu.onDidDismiss(dataDismiss => {
        if (dataDismiss && dataDismiss.redirTo == 'SendPage') {
          this.router.navigateByUrl('/accounts-page', {
            state: {
              coin: addrData.coin,
              network: addrData.network,
              toAddress: data.data
            }
          });
        }
      });
    }

  }

  private redirScanAddress(address) {
    const parsedData = this.incomingDataProvider.parseData(address);
    if (parsedData) {
      const addrData = this.addressProvider.getCoinAndNetwork(address);
      if (addrData && addrData.coin && addrData.network) {
        return this.handleSendAddress({
          data: address,
          type: parsedData.type,
          coin: addrData.coin
        }, addrData)
      }
    }
    return this.showErrorInvalidQr(' ', 'Invalid QR code');
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
    this.location.back();
  }
}
