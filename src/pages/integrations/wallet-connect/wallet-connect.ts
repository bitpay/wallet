import { ChangeDetectorRef, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';

// Pages
import { ConfirmPage } from '../../../pages/send/confirm/confirm';
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

import { animate, style, transition, trigger } from '@angular/animations';
import * as _ from 'lodash';

export interface PeerMeta {
  description: string;
  url: string;
  icons: string[];
  name: string;
  ssl?: boolean;
}

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
    trigger('fadeIn', [
      transition(':enter', [
        style({
          opacity: 0
        }),
        animate('300ms')
      ])
    ]),
    trigger('fadeOut', [
      transition(':leave', [
        animate(
          '200ms',
          style({
            opacity: 0
          })
        )
      ])
    ])
  ]
})
export class WalletConnectPage {
  public uri: string = '';
  public fromWalletConnect: boolean;
  private wallets;
  public isCordova: boolean;
  public peerMeta: PeerMeta;
  public requests: any[] = [];
  public connected: boolean = false;
  public wallet;
  public address: string;
  public activeChainId: number = 1;
  public showDappInfo: boolean;
  public title: string;
  public sessionRequestLabel: string;
  public showWalletSelector: boolean = false;
  public loading: boolean = false;
  private isEventLogged: boolean = false;
  private walletId: string;
  public exitingAnimationPatch: boolean;
  public isAndroid: boolean;
  private detailsActive: boolean;
  private confirmActive: boolean;

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
    this.navCtrl.swipeBackEnabled = false;
    this.isCordova = this.platformProvider.isCordova;
    this.isAndroid = this.platformProvider.isAndroid;
    this.uri = this.navParams.data.uri;
    this.showDappInfo = !!this.uri;
    this.walletId = this.navParams.data.walletId;
    if (!this.walletId) this.showWalletSelector = true;
    this.wallet = this.profileProvider.getWallet(this.walletId);
    this.fromWalletConnect = this.navParams.data.fromWalletConnect;
    this.events.subscribe('Local/UriScan', this.updateAddressHandler);
    this.events.subscribe('Update/ConnectionData', this.setConnectionData);
    this.events.subscribe('Update/Requests', this.setRequests);
    this.events.subscribe(
      'Update/GoBackToBrowserNotification',
      this.showNotification
    );
    this.events.subscribe('Update/WalletConnectDisconnected', this.goBack);
    this.events.subscribe(
      'Update/ViewingWalletConnectDetails',
      (status: boolean) => (this.detailsActive = status)
    );
    this.events.subscribe(
      'Update/ViewingWalletConnectConfirm',
      (status: boolean) => (this.confirmActive = status)
    );

    this.wallets = this.profileProvider.getWallets({
      coin: 'eth',
      onlyComplete: true,
      backedUp: true,
      m: 1,
      n: 1
    });

    this.init();
  }

  ionViewWillEnter() {
    // not ideal - workaround for navCtrl issues
    this.exitingAnimationPatch = false;
    this.events.publish('Update/ViewingWalletConnectMain', true);
  }

  ionViewWillLeave() {
    this.exitingAnimationPatch = !this.detailsActive || !this.confirmActive;
    this.events.publish('Update/ViewingWalletConnectMain', false);
    this.onGoingProcessProvider.clear();
  }
  ngOnDestroy() {
    this.events.unsubscribe('Local/UriScan', this.updateAddressHandler);
    this.events.unsubscribe('Update/ConnectionData', this.setConnectionData);
    this.events.unsubscribe('Update/Requests', this.setRequests);
    this.events.unsubscribe(
      'Update/GoBackToBrowserNotification',
      this.showNotification
    );
    this.events.unsubscribe('Update/WalletConnectDisconnected', this.goBack);
  }

  private async init() {
    const session = await this.persistenceProvider.getWalletConnect();
    this.uri && !session ? this.initWalletConnect() : this.initWallet();
  }

  private updateAddressHandler: any = data => {
    this.analyticsProvider.logEvent('wallet_connect_camera_scan_attempt', {});
    this.uri = data.value;
  };

  private goBack = () => {
    if (this.navCtrl.canGoBack()) {
      this.navCtrl.pop();
    }
  };

  private showNotification = () => {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'in-app-notification',
      {
        title: 'Connected',
        body: this.translate.instant('You can now return to your browser.')
      }
    );
    infoSheet.present();
    setTimeout(() => {
      infoSheet.dismiss();
    }, 5000);
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
    // check if wallet still exist
    if (!this.wallet) {
      this.errorsProvider.showDefaultError(
        this.translate.instant(
          'Could not found your selected wallet. Try with a new connection'
        ),
        this.translate.instant('Could not connect')
      );
      await this.killSession();
      return;
    }
    this.address = address;
    this.peerMeta = peerMeta;
    this.requests = requests;
    this.sessionRequestLabel =
      this.peerMeta && this.peerMeta.name
        ? `${this.peerMeta.name} ${this.translate.instant(
            'wants to connect to your wallet'
          )}`
        : null;
    this.changeRef.detectChanges();
  };

  private setRequests: any = (requests, incoming?) => {
    this.requests = requests;
    if (incoming && !this.detailsActive && !this.confirmActive) {
      this.goToNextView(incoming, incoming.params, true);
    }
    this.changeRef.detectChanges();
  };

  public async initWallet(): Promise<void> {
    const walletConnectData = await this.persistenceProvider.getWalletConnect();
    if (walletConnectData) {
      this.onGoingProcessProvider.set('Connecting');
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
    this.onGoingProcessProvider.set('Connecting');
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
        `{{peerMetaName}} ({{peerMetaUrl}}) is requesting to connect. This will disconnect your current session.`
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
          this.events.publish(
            'Update/WalletConnectNewSessionRequest',
            this.uri
          );
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
    this.walletId = null;
    this.peerMeta = null;
    this.connected = false;
    this.loading = false;
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

  public goToNextView(request, params, skipConfirmation?: boolean) {
    if (request && request.method === 'eth_sendTransaction') {
      const address = this.address;
      const wallet = this.wallet;
      const peerMeta = this.peerMeta;
      const addressRequested = request.params[0].from;
      const isApproveRequest =
        request &&
        request.decodedData &&
        request.decodedData.name === 'approve';
      if (address.toLowerCase() === addressRequested.toLowerCase()) {
        // redirect to confirm page with navParams
        let data = {
          amount: request.params[0].value,
          toAddress: request.params[0].to,
          coin: wallet.credentials.coin,
          walletId: wallet.credentials.walletId,
          network: wallet.network,
          data: request.params[0].data,
          gasLimit: request.params[0].gas,
          requestId: request.id,
          isApproveRequest,
          tokenInfo: isApproveRequest ? request.tokenInfo : null,
          peerMeta
        };
        this.logger.debug(
          'redirect to confirm page with data: ',
          JSON.stringify(data)
        );

        if (isApproveRequest || skipConfirmation) {
          this.navCtrl.push(ConfirmPage, data);
        } else this.openConfirmPageConfirmation(peerMeta, data);
      } else {
        this.errorsProvider.showDefaultError(
          this.translate.instant(
            'Address requested does not match active account'
          ),
          this.translate.instant('Error')
        );
      }
    } else this.goToRequestDetailsPage(request, params);
  }

  public openConfirmPageConfirmation(peerMeta, data): void {
    const title = this.translate.instant('Confirm Request');
    let message = this.replaceParametersProvider.replace(
      this.translate.instant(
        `Please check on {{peerMetaName}} that the request is still waiting for confirmation and the swap amount is correct before proceeding to the confirmation step`
      ),
      { peerMetaName: peerMeta.name }
    );
    const okText = this.translate.instant('Continue');
    const cancelText = this.translate.instant('Go Back');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then((res: boolean) => {
        if (res) {
          this.navCtrl.push(ConfirmPage, data);
        }
      });
  }

  public setDefaultImgSrc(img) {
    if (
      !this.isEventLogged &&
      this.peerMeta &&
      this.peerMeta.icons &&
      this.peerMeta.icons[0]
    ) {
      this.analyticsProvider.logEvent('wallet_connect_img_src_blocked', {
        imgSrc: this.peerMeta.icons[0]
      });
      this.isEventLogged = true;
    }

    img.onerror = null;
    img.src = 'assets/img/wallet-connect/icon-dapp.svg';
  }

  public trackByFn(index: number): number {
    return index;
  }
}
