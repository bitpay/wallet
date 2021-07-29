import { Component } from '@angular/core';
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
@Component({
  selector: 'page-wallet-connect',
  templateUrl: 'wallet-connect.html'
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
  public showDappInfo: boolean = false;
  public title: string;
  public sessionRequestLabel: string;
  public showWalletSelector: boolean = false;

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
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.isCordova = this.platformProvider.isCordova;
    this.uri = this.navParams.data.uri;
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.fromWalletConnect = this.navParams.data.fromWalletConnect;
    this.events.subscribe('Local/UriScan', this.updateAddressHandler);
    this.events.subscribe('Update/ConnectionData', this.getConnectionData);
    this.events.subscribe('Update/Requests', this.setRequests);
    this.wallets = this.profileProvider.getWallets({
      coin: 'eth',
      onlyComplete: true,
      backedUp: true
    });
    if (!this.navParams.data.walletId) this.showWalletSelector = true;
    this.uri ? this.initWalletConnect() : this.initWallet();
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/UriScan', this.updateAddressHandler);
    this.events.unsubscribe('Update/ConnectionData', this.getConnectionData);
    this.events.unsubscribe('Update/Requests', this.setRequests);
  }

  private updateAddressHandler: any = data => {
    this.analyticsProvider.logEvent('wallet_connect_camera_scan_attempt', {});
    this.uri = data.value;
  };

  private getConnectionData: any = async _ => {
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
    this.onGoingProcessProvider.clear();
  };

  private setRequests: any = requests => {
    this.requests = requests;
  };

  public async initWallet(): Promise<void> {
    const walletConnectData = await this.persistenceProvider.getWalletConnect();
    if (walletConnectData) {
      this.onGoingProcessProvider.set('Initializing');
      this.getConnectionData();
      this.title = null;
      if (this.uri && this.uri.indexOf('bridge') !== -1) {
        this.showNewConnectionAlert();
      } else {
        this.uri = null;
      }
    } else {
      this.title = this.translate.instant('Enter WalletConnect URI');
      if (!_.isEmpty(this.wallets)) this.onWalletSelect(this.wallet);
    }
  }

  public async onWalletSelect(wallet): Promise<void> {
    this.wallet = wallet ? wallet : this.wallets[0];
    this.walletConnectProvider.setAccountInfo(wallet);
  }

  public async initWalletConnect(): Promise<void> {
    this.logger.info('Initialize wallet connect with uri: ' + this.uri);
    this.onGoingProcessProvider.set('Initializing');
    try {
      await this.walletConnectProvider.initWalletConnect(this.uri);
      await this.walletConnectProvider.subscribeToEvents();
      this.showDappInfo = true;
      this.title = null;
      await this.walletConnectProvider.checkDappStatus();
      this.onGoingProcessProvider.clear();
    } catch (error) {
      this.showDappInfo = false;
      this.uri = null;
      this.title = this.translate.instant('Enter WalletConnect URI');
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
        `{{walletName}} will be disconected from your actual connection to {{peerMetaName}} ({{peerMetaUrl}})`
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
    this.showDappInfo = false;
    this.uri = null;
    await this.walletConnectProvider.killSession();
    this.navCtrl.pop();
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
      { fromWalletConnect: true, walletSelected: true, updateURI: true },
      { animate: false }
    );
  }

  public async approveSession() {
    try {
      await this.walletConnectProvider.approveSession();
    } catch (error) {
      this.logger.error('Wallet Connect - ApproveSession error: ', error);
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
}
