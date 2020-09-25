import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import WalletConnect from '@walletconnect/browser';
import * as ethers from 'ethers';
import { NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import {
  ActionSheetProvider,
  Logger,
  PersistenceProvider,
  ProfileProvider,
  WalletConnectProvider,
  WalletProvider
} from '../../../providers';

import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID
} from '../../../providers/wallet-connect/web3-providers/web3-providers';

@Component({
  selector: 'page-wallet-connect',
  templateUrl: 'wallet-connect.html'
})
export class WalletConnectPage {
  isOpenSelector: boolean = false;
  loading: boolean = false;
  scanner: boolean = false;
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
  displayRequest: any = null;
  activeIndex: number = 0;
  activeChainId: number = 1;
  wallets;
  wallet: ethers.Wallet | null = null;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private navParams: NavParams,
    private persistenceProvider: PersistenceProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider,
    private walletConnectProvider: WalletConnectProvider
  ) {}

  ngOnInit(): void {
    this.accounts = this.getAccounts();
    this.address = this.accounts[this.activeIndex];
    this.initWallet();
  }

  ionViewWillEnter() {
    this.wallets = this.profileProvider.getWallets({ coin: 'eth' });
    if (_.isEmpty(this.wallets)) {
      return;
    } else {
      this.onWalletSelect(this.wallets[0]);
    }
  }

  public onWalletSelect(wallet): void {
    this.activeIndex = this.wallets.indexOf(wallet);
    this.activeChainId =
      wallet.network === 'livenet' ? MAINNET_CHAIN_ID : KOVAN_CHAIN_ID;
    this.updateChain(this.activeChainId);
    this.updateAddress(this.activeIndex);
  }

  public async initWallet() {
    const session = await this.persistenceProvider.getWalletConnect();

    if (!session) {
      await this.updateWallet(this.activeIndex, this.activeChainId);
    } else {
      this.walletConnector = new WalletConnect({ session });

      const { connected, accounts, peerMeta } = this.walletConnector;

      this.address = accounts[0];

      this.activeIndex = accounts.indexOf(this.address);
      this.activeChainId = this.walletConnector.chainId;

      await this.updateWallet(this.activeIndex, this.activeChainId);

      this.connected = connected;
      this.accounts = accounts;
      this.peerMeta = peerMeta;

      this.subscribeToEvents();
    }
  }

  public async initWalletConnect() {
    this.uri = this.navParams.data.uri;
    this.loading = true;

    try {
      this.walletConnector = new WalletConnect({ uri: this.uri });
      await this.persistenceProvider.setWalletConnect(this.walletConnector);

      if (!this.walletConnector.connected) {
        await this.walletConnector.createSession();
      }

      this.loading = false;

      this.subscribeToEvents();
    } catch (error) {
      this.loading = false;
      throw error;
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

  public approveSession() {
    if (this.walletConnector) {
      this.walletConnector.approveSession({
        chainId: this.activeChainId,
        accounts: [this.address]
      });
    }
  }

  public rejectSession() {
    if (this.walletConnector) {
      this.walletConnector.rejectSession();
    }
  }

  public killSession() {
    if (this.walletConnector) {
      this.walletConnector.killSession();
    }
    this.initWallet();
  }

  public subscribeToEvents() {
    if (this.walletConnector) {
      this.walletConnector.on('session_request', (error, payload) => {
        this.logger.debug('walletConnector.on("session_request")');

        if (error) {
          throw error;
        }

        this.peerMeta = payload.params[0].peerMeta;
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
        const requests = this.requests;
        requests.push(payload);
        this.requests = requests;
      });

      this.walletConnector.on('connect', (error, _payload) => {
        this.logger.debug('walletConnector.on("connect")');

        if (error) {
          throw error;
        }
        this.connected = true;
      });

      this.walletConnector.on('disconnect', (error, _payload) => {
        this.logger.debug('walletConnector.on("disconnect")');

        if (error) {
          throw error;
        }

        this.initWallet();
      });

      if (this.walletConnector.connected) {
        const { chainId, accounts } = this.walletConnector;
        const index = 0;
        this.address = accounts[index];
        this.updateWallet(index, chainId);
        this.connected = true;
        this.activeChainId = chainId;
      }
    }
  }

  public async updateSession(sessionParams: {
    chainId?: number;
    activeIndex?: number;
  }) {
    const _chainId = sessionParams.chainId || this.activeChainId;
    const _activeIndex = sessionParams.activeIndex || this.activeIndex;
    const address = this.accounts[_activeIndex];
    if (this.walletConnector) {
      this.walletConnector.updateSession({
        chainId: _chainId,
        accounts: [address]
      });
    }
  }

  public async updateChain(chainId: number | string) {
    const _chainId = Number(chainId);
    await this.updateWallet(this.activeIndex, _chainId);
    await this.updateSession({ chainId: _chainId });
  }

  public async updateAddress(activeIndex: number) {
    await this.updateWallet(activeIndex, this.activeChainId);
    await this.updateSession({ activeIndex });
  }

  public openRequest(request: any) {
    this.displayRequest = request;
  }

  public async closeRequest() {
    const filteredRequests = this.requests.filter(
      request => request.id !== this.displayRequest.id
    );

    this.requests = filteredRequests;
    this.displayRequest = null;
  }

  public async rejectRequest() {
    if (this.walletConnector) {
      this.walletConnector.rejectRequest({
        id: this.displayRequest.id,
        error: { message: 'Failed or Rejected Request' }
      });
    }
    await this.closeRequest();
  }

  public async approveRequest() {
    let errorMsg = '';

    try {
      let result = null;

      if (this.walletConnector) {
        if (!this.getWallet()) {
          await this.updateWallet(this.activeIndex, this.activeChainId);
        }

        let transaction = null;
        let addressRequested = null;

        switch (this.displayRequest.method) {
          case 'eth_sendTransaction':
            transaction = this.displayRequest.params[0];
            addressRequested = transaction.from;
            if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
              result = await this.walletProvider.broadcastTx(
                this.wallet,
                transaction
              );
            } else {
              errorMsg = 'Address requested does not match active account';
            }
            break;
          case 'eth_signTransaction':
            transaction = this.displayRequest.params[0];
            addressRequested = transaction.from;
            if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
              result = await this.walletProvider.publishAndSign(
                this.wallet,
                transaction
              );
            } else {
              errorMsg = 'Address requested does not match active account';
            }
            break;
          default:
            break;
        }

        if (result) {
          this.walletConnector.approveRequest({
            id: this.displayRequest.id,
            result
          });
        } else {
          let message = 'JSON RPC method not supported';
          if (!this.getWallet()) {
            message = 'No Active Account';
          }
          this.walletConnector.rejectRequest({
            id: this.displayRequest.id,
            error: { message }
          });
        }
      }
    } catch (error) {
      this.logger.error(error);
      if (this.walletConnector) {
        this.walletConnector.rejectRequest({
          id: this.displayRequest.id,
          error: { message: errorMsg || 'Failed or Rejected Request' }
        });
      }
    }

    this.closeRequest();
  }

  public updateWallet(index: number, chainId: number) {
    this.activeIndex = index;
    this.activeChainId = chainId;
    const rpcUrl = this.getChainData(chainId).rpc_url;
    this.wallet = this.walletConnectProvider.generateWallet(index);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.wallet.connect(provider);
    return this.wallet;
  }

  public getWallet(index?: number, chainId?: number): ethers.Wallet {
    let _wallet = this.wallet;
    if (
      !_wallet ||
      this.activeIndex === index ||
      this.activeChainId === chainId
    ) {
      _wallet = this.updateWallet(index, chainId);
    }
    return _wallet;
  }

  public getChainData(chainId) {
    return this.walletConnectProvider.getChainData(chainId);
  }

  public getAccounts() {
    const accounts = [];
    let wallet = null;
    for (let i = 0; i < 1; i++) {
      wallet = this.walletConnectProvider.generateWallet(i);
      accounts.push(wallet.address);
    }
    return accounts;
  }
}
