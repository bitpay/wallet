import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import WalletConnect from '@walletconnect/browser';
import { convertHexToNumber } from "@walletconnect/utils";
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
  ) { }

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
    // this.uri = this.navParams.data.uri;
    this.uri =
      'wc:506b0a55-aab8-4753-93bd-ccdc0f6d65f8@1?bridge=https://bridge.walletconnect.org&key=f43f276ad4d14a68b0e7f542dc7cb63a2a27f5773d2fc508a9e6abeb3c210186';
    this.loading = true;

    try {
      this.walletConnector = new WalletConnect({ uri: this.uri });

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

  public async approveSession() {
    if (this.walletConnector) {
      this.walletConnector.approveSession({
        chainId: this.activeChainId,
        accounts: [this.address]
      });
      await this.persistenceProvider.setWalletConnect(
        this.walletConnector.session
      );
    }
  }

  public rejectSession() {
    if (this.walletConnector) {
      this.walletConnector.rejectSession();
    }
  }

  public async killSession() {
    if (this.walletConnector) {
      this.walletConnector.killSession();
      await this.persistenceProvider.removeWalletConnect();
    }
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
        requests.push(payload);
        this.requests = requests;
        this.renderEthereumRequests(payload);
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

        this.connected = false;
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

        let addressRequested = null;
        let dataToSign = null;
        let txOpts = this.displayRequest.params[0];
        addressRequested = this.displayRequest.params[0].from;
        const txProposal = txOpts;

        switch (this.displayRequest.method) {
          case 'eth_sendTransaction':
            if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
              // redirect to confirm page with navParams
              result = await this.walletProvider.broadcastTx(
                this.wallet,
                txProposal
              );
            } else {
              errorMsg = 'Address requested does not match active account';
            }
            break;
          case 'eth_signTransaction':
            if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
              const password = ''; // this.walletProvider.prepare implement getpassword here
              result = await this.walletProvider.signTx(
                this.wallet,
                txProposal,
                password
              );
            } else {
              errorMsg = 'Address requested does not match active account';
            }
            break;
          case "eth_sign":
            dataToSign = this.displayRequest.params[1];
            addressRequested = this.displayRequest.params[0];
            if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
              result = ''; // await this.walletProvider.signMessage(dataToSign);
            } else {
              errorMsg = "Address requested does not match active account";
            }
            break;
          case "personal_sign":
            dataToSign = this.displayRequest.params[0];
            addressRequested = this.displayRequest.params[1];
            if (this.address.toLowerCase() === addressRequested.toLowerCase()) {
              result = ''; // await this.walletProvider.signPersonalMessage(dataToSign); 
            } else {
              errorMsg = "Address requested does not match active account";
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

  private renderEthereumRequests(payload) {
    let params = [{ label: "Method", value: payload.method }];

    switch (payload.method) {
      case "eth_sendTransaction":
      case "eth_signTransaction":
        params = [
          ...params,
          { label: "From", value: payload.params[0].from },
          { label: "To", value: payload.params[0].to },
          {
            label: "Gas Limit",
            value: payload.params[0].gas
              ? convertHexToNumber(payload.params[0].gas)
              : payload.params[0].gasLimit
                ? convertHexToNumber(payload.params[0].gasLimit)
                : "",
          },
          {
            label: "Gas Price",
            value: convertHexToNumber(payload.params[0].gasPrice),
          },
          {
            label: "Nonce",
            value: convertHexToNumber(payload.params[0].nonce),
          },
          {
            label: "Value",
            value: convertHexToNumber(payload.params[0].value),
          },
          { label: "Data", value: payload.params[0].data },
        ];
        break;

      case "eth_sign":
        params = [
          ...params,
          { label: "Address", value: payload.params[0] },
          { label: "Message", value: payload.params[1] },
        ];
        break;
      case "personal_sign":
        params = [
          ...params,
          { label: "Address", value: payload.params[1] },
          {
            label: "Message",
            value: convertHexToUtf8IfPossible(payload.params[0]),
          },
        ];
        break;
      default:
        params = [
          ...params,
          {
            label: "params",
            value: JSON.stringify(payload.params, null, "\t"),
          },
        ];
        break;
    }
    return params;
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
