import { ChangeDetectorRef, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';

// Pages
import { ScanPage } from '../../scan/scan';
import { WalletConnectRequestDetailsPage } from './wallet-connect-request-details/wallet-connect-request-details';

// Providers
import {
  ActionSheetProvider,
  AnalyticsProvider,
  ErrorsProvider,
  Logger,
  OnGoingProcessProvider,
  PersistenceProvider,
  PlatformProvider,
  PopupProvider,
  ProfileProvider,
  ReplaceParametersProvider,
  WalletConnectProvider
} from '../../../providers';

import * as _ from 'lodash';
import { animate, style, transition, trigger } from '@angular/animations';
@Component({
  selector: 'page-wallet-connect',
  templateUrl: 'wallet-connect.html',
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({
          transform: 'translateY(5px)',
          opacity: 0
        }),
        animate('300ms')
      ])
    ]),
    trigger('fadeOut', [
      transition(':leave', [
        animate('200ms', style({
          opacity: 0
        }),)
      ])
    ]),
  ]
})
export class WalletConnectPage {
  public uri: string = '';
  public fromWalletConnect: boolean;
  private wallets;
  public isCordova: boolean;
  public peerMeta: {
    description: string;
    url: string;
    icons: string[];
    name: string;
    ssl?: boolean;
  };
  public requests: any[] = [];
  public connected: boolean = false;
  public wallet;
  public address: string;
  public activeChainId: number = 1;
  public showDappInfo: boolean;
  public title: string;
  public sessionRequestLabel: string;
  public showWalletSelector: boolean = false;
  public dappImgSrc: string;
  public loading: boolean = false;
  public defaultImgSrc: string = 'assets/img/wallet-connect/icon-dapp.svg';
  private isEventLogged: boolean = false;
  private walletId: string;
  public exiting: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private navParams: NavParams,
    private persistenceProvider: PersistenceProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private walletConnectProvider: WalletConnectProvider,
    private errorsProvider: ErrorsProvider,
    private popupProvider: PopupProvider,
    private analyticsProvider: AnalyticsProvider,
    private navCtrl: NavController,
    private events: Events,
    private platformProvider: PlatformProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private changeRef: ChangeDetectorRef
  ) {
    this.isCordova = this.platformProvider.isCordova;
    this.uri = this.navParams.data.uri;
    this.showDappInfo = this.uri ? true : false;
    this.walletId = this.navParams.data.walletId;
    if (!this.walletId) this.showWalletSelector = true;
    this.wallet = this.profileProvider.getWallet(this.walletId);
    this.fromWalletConnect = this.navParams.data.fromWalletConnect;
    this.events.subscribe('Local/UriScan', this.updateAddressHandler);
    this.events.subscribe('Update/ConnectionData', this.setConnectionData);
    this.events.subscribe('Update/Requests', this.setRequests);
    this.events.subscribe('Update/WalletConnectDisconnected', () => this.navCtrl.pop());

    this.wallets = this.profileProvider.getWallets({
      coin: 'eth',
      onlyComplete: true,
      backedUp: true,
      m: 1,
      n: 1
    });
    this.uri &&
    !this.navParams.data.activePage &&
    !this.navParams.data.isDeepLink
      ? this.initWalletConnect()
      : this.initWallet();
  }

  ionViewWillLeave() {
    this.setExiting();
    this.onGoingProcessProvider.clear();
  }
  ngOnDestroy() {
    this.events.unsubscribe('Local/UriScan', this.updateAddressHandler);
    this.events.unsubscribe('Update/ConnectionData', this.setConnectionData);
    this.events.unsubscribe('Update/Requests', this.setRequests);
  }

  private updateAddressHandler: any = data => {
    this.analyticsProvider.logEvent('wallet_connect_camera_scan_attempt', {});
    this.uri = data.value;
  };

  private setConnectionData: any = async _ => {
    const {
      connected,
      activeChainId,
      walletId,
      address,
      peerMeta,
      requests
    } = await this.walletConnectProvider.getConnectionData();
    this.connected = connected;
    this.activeChainId = activeChainId;
    this.wallet = this.profileProvider.getWallet(walletId);
    this.address = address;
    this.peerMeta = peerMeta;
    this.requests = requests;
    this.sessionRequestLabel =
      this.peerMeta && this.peerMeta.name
        ? `${this.peerMeta.name} ${this.translate.instant(
            'wants to connect to your wallet'
          )}`
        : null;
    this.setDappImgSrc();
    this.changeRef.detectChanges();
  };

  private setRequests: any = requests => {
    this.requests = requests;
    this.changeRef.detectChanges();
  };

  public async initWallet(): Promise<void> {
    const walletConnectData = await this.persistenceProvider.getWalletConnect();
    if (walletConnectData) {
      this.onGoingProcessProvider.set('Initializing');
      await this.setConnectionData();
      this.showWalletSelector = false;
      this.title = null;
      if (this.uri && this.uri.indexOf('bridge') !== -1) {
        this.showNewConnectionAlert();
      } else {
        this.uri = null;
      }
      this.onGoingProcessProvider.clear();
    } else {
      this.resetView();
      if (!_.isEmpty(this.wallets)) this.onWalletSelect(this.wallet);
    }
  }

  public async onWalletSelect(wallet): Promise<void> {
    this.wallet = wallet ? wallet : this.wallets[0];
    this.walletConnectProvider.setAccountInfo(this.wallet);
    this.changeRef.detectChanges();
  }

  public async initWalletConnect(): Promise<void> {
    this.logger.info('Initialize wallet connect with uri: ' + this.uri);
    this.onGoingProcessProvider.set('Initializing');
    this.loading = true;
    try {
      await this.walletConnectProvider.initWalletConnect(this.uri);
      await this.walletConnectProvider.checkDappStatus();
      this.showDappInfo = true;
      this.title = null;
      this.onGoingProcessProvider.clear();
      this.loading = false;
      this.showWalletSelector = false;
    } catch (error) {
      await this.killSession();
      this.logger.error('Wallet Connect - initWalletConnect error: ', error);
      this.onGoingProcessProvider.clear();
    }
  }

  private showNewConnectionAlert(): void {
    const wallet = this.wallet;
    const peerMeta = this.peerMeta;
    const title = this.translate.instant('New Session Request');
    const message = this.replaceParametersProvider.replace(
      this.translate.instant(
        `{{walletName}} will be disconnected from your actual connection to {{peerMetaName}} ({{peerMetaUrl}})`
      ),
      {
        walletName: wallet.name,
        peerMetaName: peerMeta.name,
        peerMetaUrl: peerMeta.url
      }
    );
    const okText = this.translate.instant('Continue');
    const cancelText = this.translate.instant('Go Back');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then((res: boolean) => {
        if (res) {
          this.killSession();
        }
      });
  }

  public async killSession() {
    try {
      await this.walletConnectProvider.killSession();
      await this.navCtrl.pop();
    } catch (error) {
      this.logger.error('Wallet Connect - killSession error: ', error);
    }
  }

  private resetView() {
    this.showDappInfo = false;
    this.uri = null;
    this.peerMeta = null;
    this.connected = false;
    this.loading = false;
    this.showWalletSelector = !this.walletId;
    this.title = this.translate.instant('Enter WalletConnect URI');
    this.changeRef.detectChanges();
  }

  public showWallets(): void {
    const params = {
      wallets: this.wallets,
      selectedWalletId: null,
      title: this.translate.instant('Select a wallet')
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.onSelectWalletEvent(wallet);
    });
  }

  private onSelectWalletEvent(wallet): void {
    if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
  }

  public getChainData(chainId) {
    return this.walletConnectProvider.getChainData(chainId);
  }

  public openScanner(): void {
    this.navCtrl.push(
      ScanPage,
      { fromWalletConnect: true, updateURI: true },
      { animate: false }
    );
  }

  public async approveSession() {
    try {
      await this.walletConnectProvider.approveSession();
    } catch (error) {
      this.logger.error('Wallet Connect - ApproveSession error: ', error);
      this.killSession();
      this.errorsProvider.showDefaultError(
        error,
        this.translate.instant('Error')
      );
    }
  }

  public goToRequestDetailsPage(request, params) {
    this.navCtrl.push(WalletConnectRequestDetailsPage, {
      request,
      params
    });
  }

  public setDappImgSrc(useDefault?: boolean) {
    if (
      useDefault &&
      !this.isEventLogged &&
      this.peerMeta &&
      this.peerMeta.icons
    ) {
      this.analyticsProvider.logEvent('wallet_connect_img_src_blocked', {
        imgSrc: this.peerMeta.icons[0]
      });
      this.isEventLogged = true;
    }

    this.dappImgSrc =
      this.peerMeta && this.peerMeta.icons && !useDefault
        ? this.peerMeta.icons[1]
          ? this.peerMeta.icons[1]
          : this.peerMeta.icons[0]
        : this.defaultImgSrc;
  }

  public trackByFn(index: number): number {
    return index;
  }

  /*
  * IOS workaround - ion-toolbar conflicts with the router animation and lags.
  * This animates the toolbar out slightly before the router animation finishes to compensate.
  * */
  private setExiting() {
    if (!['WalletConnectRequestDetailsPage']
      .includes(this.navCtrl.getActive(true).name)) {
      this.exiting = true;
    }
  }
}
