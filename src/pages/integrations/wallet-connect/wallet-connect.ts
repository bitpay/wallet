import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import WalletConnect from '@walletconnect/client';
import { convertHexToNumber, convertHexToUtf8 } from '@walletconnect/utils';
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
  WalletConnectProvider,
  WalletProvider
} from '../../../providers';

import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID
} from '../../../providers/wallet-connect/web3-providers/web3-providers';

import * as _ from 'lodash';
@Component({
  selector: 'page-wallet-connect',
  templateUrl: 'wallet-connect.html'
})
export class WalletConnectPage {
  isOpenSelector: boolean = false;
  walletConnector: WalletConnect | null = null;
  uri: string = '';
  peerMeta: {
    description: string;
    url: string;
    icons: string[];
    name: string;
    ssl?: boolean;
  } = {
    description: '',
    url: '',
    icons: [],
    name: '',
    ssl: false
  };
  connected: boolean = false;
  accounts: string[];
  address: string;
  requests: any[] = [];
  results: any[] = [];
  activeChainId: number = 1;
  wallets;
  wallet: any;
  isCordova: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private navParams: NavParams,
    private persistenceProvider: PersistenceProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider,
    private walletConnectProvider: WalletConnectProvider,
    private errorsProvider: ErrorsProvider,
    private popupProvider: PopupProvider,
    private analyticsProvider: AnalyticsProvider,
    private navCtrl: NavController,
    private events: Events,
    private platformProvider: PlatformProvider,
    private externalLinkProvider: ExternalLinkProvider
  ) {
    this.isCordova = this.platformProvider.isCordova;
    this.uri = this.navParams.data.uri;
    this.events.subscribe('Local/UriScan', this.updateAddressHandler);
  }

  ngOnInit(): void {
    this.initWallet();
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/UriScan', this.updateAddressHandler);
  }

  private updateAddressHandler: any = data => {
    this.analyticsProvider.logEvent('wallet_connect_camera_scan_attempt', {});
    this.uri = data.value;
  };

  public async initWallet() {
    const walletConnectData = await this.persistenceProvider.getWalletConnect();
    if (walletConnectData) {
      const session = walletConnectData.session;
      const walletId = walletConnectData.walletId;

      this.logger.debug('session', session);
      this.walletConnector = new WalletConnect({ session });

      const { connected, accounts, peerMeta } = this.walletConnector;

      this.address = accounts[0];

      this.activeChainId = this.walletConnector.chainId;

      this.connected = connected;
      this.accounts = accounts; // TODO handle multiple accounts
      this.peerMeta = peerMeta;

      this.wallet = this.profileProvider.getWallet(walletId);

      this.subscribeToEvents();
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

  public async onWalletSelect(wallet) {
    this.activeChainId =
      wallet.network === 'livenet' ? MAINNET_CHAIN_ID : KOVAN_CHAIN_ID;
    this.wallet = wallet;
    try {
      this.address = await this.walletProvider.getAddress(this.wallet, false);
    } catch (error) {
      this.errorsProvider.showDefaultError(
        error,
        this.translate.instant('Error getting address')
      );
    }
  }

  public async initWalletConnect() {
    this.logger.info('Initialize wallet connect with uri: ' + this.uri);
    try {
      this.walletConnector = new WalletConnect({
        uri: this.uri
      });
      if (!this.walletConnector.connected) {
        this.logger.debug('walletConnector.createSession');
        await this.walletConnector.createSession();
      }
      this.subscribeToEvents();
    } catch (error) {
      this.errorsProvider.showDefaultError(
        error,
        this.translate.instant('Error')
      );
    }
  }

  public showWallets(): void {
    this.isOpenSelector = true;
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
    this.isOpenSelector = false;
  }

  public async approveSession() {
    if (this.walletConnector) {
      this.logger.debug('walletConnector.approveSession');
      this.walletConnector.approveSession({
        chainId: this.activeChainId,
        accounts: [this.address]
      });
      const walletConnectData = {
        session: this.walletConnector.session,
        walletId: this.wallet.credentials.walletId
      };
      await this.persistenceProvider.setWalletConnect(walletConnectData);
    }
  }

  public rejectSession() {
    if (this.walletConnector) {
      this.logger.debug('walletConnector.rejectSession');
      this.walletConnector.rejectSession();
    }
  }

  public async killSession() {
    if (this.walletConnector) {
      this.logger.debug('walletConnector.killSession');
      this.walletConnector.killSession();
      await this.persistenceProvider.removeWalletConnect();
      this.peerMeta = null;
      this.initWallet();
    }
  }

  public subscribeToEvents() {
    if (!this.walletConnector) return;
    this.walletConnector.on('session_request', (error, payload) => {
      this.logger.debug('walletConnector.on("session_request")');

      if (error) {
        throw error;
      }

      this.peerMeta = payload.params[0].peerMeta;
      this.openConnectPopUpConfirmation(this.peerMeta);
    });

    this.walletConnector.on('session_update', (error, _payload) => {
      this.logger.debug('walletConnector.on("session_update")');

      if (error) {
        throw error;
      }
    });

    this.walletConnector.on('call_request', (error, payload) => {
      this.logger.debug('walletConnector.on("call_request")');
      if (error) {
        throw error;
      }
      // Sample Request
      // {
      // id: 1601004477618457
      // jsonrpc: "2.0"
      // method: "eth_sendTransaction"
      // params: Array(1)
      // 0:
      // data: "0x095ea7b30000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      // from: "0xf4e3dfd2c9a951928f8fd53a782e364945047d11"
      // gas: "0xd78d"
      // to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      // }

      this.analyticsProvider.logEvent('wallet_connect_call_request', {});
      const _payload = this.refEthereumRequests(payload);
      this.requests.push(_payload);
    });

    this.walletConnector.on('connect', (error, _payload) => {
      this.logger.debug('walletConnector.on("connect")');
      if (error) {
        throw error;
      }

      this.analyticsProvider.logEvent('wallet_connect_connection_success', {});
      this.connected = true;
    });

    this.walletConnector.on('disconnect', (error, _payload) => {
      this.logger.debug('walletConnector.on("disconnect")');
      if (error) {
        throw error;
      }
      this.connected = false;
    });
  }

  public async updateSession(sessionParams: {
    chainId: number;
    address: string;
  }) {
    const _chainId = sessionParams.chainId;
    const address = sessionParams.address;
    if (this.walletConnector) {
      this.logger.debug('walletConnector.updateSession');
      this.walletConnector.updateSession({
        chainId: _chainId,
        accounts: [address]
      });
    }
  }

  public async closeRequest(id) {
    const filteredRequests = this.requests.filter(request => request.id !== id);
    this.requests = filteredRequests;
  }

  public async rejectRequest(request) {
    if (this.walletConnector) {
      try {
        this.logger.debug('walletConnector.rejectRequest');
        this.walletConnector.rejectRequest({
          id: request.id,
          error: { message: 'Failed or Rejected Request' }
        });
      } catch (error) {
        this.errorsProvider.showDefaultError(
          error,
          this.translate.instant('Error')
        );
      }
    }
    await this.closeRequest(request.id);
  }

  public async approveRequest(request) {
    try {
      if (this.walletConnector) {
        let addressRequested = request.params[0].from;
        switch (request.method) {
          case 'eth_sendTransaction':
            if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
              // redirect to confirm page with navParams
              let data = {
                amount: request.params[0].value,
                toAddress: request.params[0].to,
                coin: this.wallet.credentials.coin,
                walletId: this.wallet.credentials.walletId,
                network: this.wallet.network,
                data: request.params[0].data,
                gasLimit: request.params[0].gas,
                walletConnectRequestId: request.id
              };
              this.logger.debug(
                'redirect to confirm page with data: ',
                JSON.stringify(data)
              );
              this.navCtrl.push(ConfirmPage, data);
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
            if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
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
      }
    } catch (error) {
      this.logger.error('Wallet Connect - ApproveRequest error: ', error);
      this.errorsProvider.showDefaultError(
        error,
        this.translate.instant('Error')
      );
    }
    this.closeRequest(request.id);
  }

  private refEthereumRequests(payload) {
    switch (payload.method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        payload.params[0].gas = payload.params[0].gas
          ? convertHexToNumber(payload.params[0].gas)
          : null;
        payload.params[0].gasLimit = payload.params[0].gasLimit
          ? convertHexToNumber(payload.params[0].gasLimit)
          : null;
        payload.params[0].gasPrice = payload.params[0].gasPrice
          ? convertHexToNumber(payload.params[0].gasPrice)
          : null;
        payload.params[0].nonce = payload.params[0].nonce
          ? convertHexToNumber(payload.params[0].nonce)
          : null;
        payload.params[0].value = payload.params[0].value
          ? convertHexToNumber(payload.params[0].value)
          : null;
        break;
      case 'personal_sign':
        try {
          payload.params[0] = convertHexToUtf8(payload.params[0]);
        } catch (err) {
          this.logger.error('refEthereumRequests err', err);
        }
        break;
      default:
        payload.params = JSON.stringify(payload.params, null, '\t');
        break;
    }
    return payload;
  }

  public getChainData(chainId) {
    return this.walletConnectProvider.getChainData(chainId);
  }

  public openConnectPopUpConfirmation(peerMeta): void {
    const title = this.translate.instant('Session Request');
    const message = `${peerMeta.name} (${peerMeta.url}${peerMeta.description}) is trying to connect to ${this.wallet.name}`;
    const okText = this.translate.instant('Approve');
    const cancelText = this.translate.instant('Reject');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then((res: boolean) => {
        if (res) {
          this.approveSession();
        } else {
          this.rejectSession();
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
