import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';

// Pages
import { ScanPage } from '../../scan/scan';
import { ConfirmPage } from '../../send/confirm/confirm';

// Providers
import {
  ActionSheetProvider,
  AnalyticsProvider,
  ErrorsProvider,
  ExternalLinkProvider,
  Logger,
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
    private externalLinkProvider: ExternalLinkProvider,
    private replaceParametersProvider: ReplaceParametersProvider
  ) {
    this.isCordova = this.platformProvider.isCordova;
    this.uri = this.navParams.data.uri;
    this.events.subscribe('Local/UriScan', this.updateAddressHandler);
    this.events.subscribe('Update/ConnectionData', this.setConnectionData);
    this.events.subscribe('Update/Requests', this.setRequests);
  }

  ngOnInit(): void {
    this.initWallet();
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

  private setConnectionData: any = _ => {
    const {
      connected,
      activeChainId,
      walletId,
      address,
      peerMeta,
      requests
    } = this.walletConnectProvider.getConnectionData();
    this.connected = connected;
    this.activeChainId = activeChainId;
    this.wallet = this.profileProvider.getWallet(walletId);
    this.address = address;
    this.peerMeta = peerMeta;
    this.requests = requests;
  };

  private setRequests: any = requests => {
    this.requests = requests;
  };

  public async initWallet(): Promise<void> {
    const walletConnectData = await this.persistenceProvider.getWalletConnect();
    if (walletConnectData) {
      this.setConnectionData();
      if (this.uri && this.uri.indexOf('bridge') !== -1) {
        this.showNewConnectionAlert();
      } else {
        this.uri = null;
      }
    } else {
      this.wallets = this.profileProvider.getWallets({
        coin: 'eth',
        onlyComplete: true,
        backedUp: true
      });
      if (_.isEmpty(this.wallets)) {
        return;
      } else {
        this.onWalletSelect(this.wallets[0]);
      }
    }
  }

  public async onWalletSelect(wallet): Promise<void> {
    this.wallet = wallet;
    this.walletConnectProvider.setAccountInfo(wallet);
  }

  public async initWalletConnect(): Promise<void> {
    this.logger.info('Initialize wallet connect with uri: ' + this.uri);
    this.walletConnectProvider.initWalletConnect(this.uri);
    this.uri = null;
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
    await this.walletConnectProvider.killSession();
    this.initWallet();
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

  public rejectRequest(request): void {
    this.walletConnectProvider.rejectRequest(request);
  }

  public approveRequest(request): void {
    try {
      let addressRequested = request.params[0].from;
      const address = this.address;
      const wallet = this.wallet;
      const peerMeta = this.peerMeta;

      switch (request.method) {
        case 'eth_sendTransaction':
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
              walletConnectRequestId: request.id
            };
            this.logger.debug(
              'redirect to confirm page with data: ',
              JSON.stringify(data)
            );
            this.openConfirmPageConfirmation(peerMeta, data);
          } else {
            this.errorsProvider.showDefaultError(
              this.translate.instant(
                'Address requested does not match active account'
              ),
              this.translate.instant('Error')
            );
          }
          break;
        case 'eth_signTransaction':
          if (address.toLowerCase() === addressRequested.toLowerCase()) {
            // TODO
            // redirect to confirm page with navParams
            // result = await this.walletProvider.signTx(
            //   this.wallet,
            //   txProposal,
            //   password
            // );
          } else {
            this.errorsProvider.showDefaultError(
              this.translate.instant(
                'Address requested does not match active account'
              ),
              this.translate.instant('Error')
            );
          }
          break;
        case 'eth_sign':
          // TODO
          // dataToSign = request.params[1];
          // addressRequested = request.params[0];
          // if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
          //   result = ''; // await this.walletProvider.signMessage(dataToSign); TODO
          // } else {
          //   this.errorsProvider.showDefaultError(
          //     this.translate.instant('Address requested does not match active account'),
          //     this.translate.instant('Error')
          //   );
          // }
          break;
        case 'personal_sign':
          // TODO
          // dataToSign = request.params[0];
          // addressRequested = request.params[1];
          // if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
          //   result = ''; // await this.walletProvider.signPersonalMessage(dataToSign); TODO
          // } else {
          //   this.errorsProvider.showDefaultError(
          //     this.translate.instant('Address requested does not match active account'),
          //     this.translate.instant('Error')
          //   );
          // }
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error('Wallet Connect - ApproveRequest error: ', error);
      this.errorsProvider.showDefaultError(
        error,
        this.translate.instant('Error')
      );
    }
  }

  public getChainData(chainId) {
    return this.walletConnectProvider.getChainData(chainId);
  }

  public openConfirmPageConfirmation(peerMeta, data): void {
    const title = this.translate.instant('Confirm Request');
    const message = this.replaceParametersProvider.replace(
      this.translate.instant(
        `Please make sure {{peerMetaName}} request is still waiting for confirmation, and that the amount is correct before proceeding to the confirmation step`
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

  public openScanner(): void {
    this.navCtrl.push(
      ScanPage,
      { fromWalletConnect: true },
      { animate: false }
    );
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
