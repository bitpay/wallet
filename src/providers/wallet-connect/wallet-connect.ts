import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import WalletConnect from '@walletconnect/client';
import { convertHexToNumber } from '@walletconnect/utils';
import { personalSign, signTypedData_v4 } from 'eth-sig-util';
import { Events } from 'ionic-angular';
import { KeyProvider } from '../../providers/key/key';

import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';

import { Logger } from '../../providers/logger/logger';
import { AnalyticsProvider } from '../analytics/analytics';
import { BwcProvider } from '../bwc/bwc';
import { ErrorsProvider } from '../errors/errors';
import { PersistenceProvider } from '../persistence/persistence';
import { WalletProvider } from '../wallet/wallet';
import {
  IProviderData,
  supportedProviders
} from './web3-providers/web3-providers';

import {
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID
} from '../../providers/wallet-connect/web3-providers/web3-providers';

import * as _ from 'lodash';
import { AbiDecoderProvider } from '../abi-decoder/abi-decoder';
import { IncomingDataProvider } from '../incoming-data/incoming-data';
import { OneInchProvider } from '../one-inch/one-inch';

@Injectable()
export class WalletConnectProvider {
  private walletConnector: WalletConnect | null = null;
  private peerMeta: {
    description: string;
    url: string;
    icons: string[];
    name: string;
    ssl?: boolean;
  };
  private requests: any[] = [];
  private connected: boolean = false;
  private address: string;
  private activeChainId: number = 1;
  private walletId: string;
  private supportedMethods: string[] = [
    'eth_sendTransaction',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
    'personal_sign'
  ];

  constructor(
    private logger: Logger,
    private translate: TranslateService,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private configProvider: ConfigProvider,
    private analyticsProvider: AnalyticsProvider,
    private persistenceProvider: PersistenceProvider,
    private errorsProvider: ErrorsProvider,
    private walletProvider: WalletProvider,
    private events: Events,
    private incomingDataProvider: IncomingDataProvider,
    private keyProvider: KeyProvider,
    private bwcProvider: BwcProvider,
    private abiDecoderProvider: AbiDecoderProvider,
    private oneInchProvider: OneInchProvider
  ) {
    this.logger.debug('WalletConnect Provider initialized');
  }

  public async signTypedData(data: any, wallet) {
    try {
      const password = await this.keyProvider.handleEncryptedWallet(
        wallet.keyId
      );
      const key = this.keyProvider.get(wallet.keyId, password);
      const bitcore = this.bwcProvider.getBitcore();
      const xpriv = new bitcore.HDPrivateKey(key.xPrivKey);
      const priv = xpriv.deriveChild("m/44'/60'/0'/0/0").privateKey;
      const result = signTypedData_v4(Buffer.from(priv.toString(), 'hex'), {
        data
      });
      return result;
    } catch (err) {
      throw err;
    }
  }

  public async personalSign(data: any, wallet) {
    try {
      const password = await this.keyProvider.handleEncryptedWallet(
        wallet.keyId
      );
      const key = this.keyProvider.get(wallet.keyId, password);
      const bitcore = this.bwcProvider.getBitcore();
      const xpriv = new bitcore.HDPrivateKey(key.xPrivKey);
      const priv = xpriv.deriveChild("m/44'/60'/0'/0/0").privateKey;
      const result = personalSign(Buffer.from(priv.toString(), 'hex'), {
        data
      });
      return result;
    } catch (err) {
      throw err;
    }
  }

  public register(): void {
    this.homeIntegrationsProvider.register({
      name: 'newWalletConnect',
      title: 'WalletConnect',
      icon: 'assets/img/wallet-connect/wallet-connect.svg',
      showIcon: true,
      logo: null,
      logoWidth: '110',
      background:
        'linear-gradient(to bottom,rgba(60, 63, 69, 1) 0,rgba(45, 47, 51, 1) 100%)',
      page: 'WalletConnectPage',
      show: !!this.configProvider.get().showIntegration['newWalletConnect'],
      type: 'external-services'
    });
  }

  public async retrieveWalletConnector(walletConnectData) {
    if (walletConnectData) {
      const session = walletConnectData.session;
      const walletId = walletConnectData.walletId;

      this.logger.debug('retrieving session');

      this.walletConnector = new WalletConnect({ session });

      const { connected, accounts, peerMeta } = this.walletConnector;

      this.address = accounts[0]; // TODO handle multiple accounts

      this.activeChainId = this.walletConnector.chainId;

      this.connected = connected;
      this.peerMeta = peerMeta;
      this.walletId = walletId;

      this.subscribeToEvents();
    }
  }

  public async initWalletConnect(uri): Promise<void> {
    try {
      this.walletConnector = new WalletConnect({
        uri
      });
      if (!this.walletConnector.connected) {
        this.logger.debug('walletConnector.createSession');
        await this.walletConnector.createSession();
      }
      await this.subscribeToEvents();
    } catch (error) {
      this.errorsProvider.showDefaultError(
        error,
        this.translate.instant('Could not connect')
      );
    }
  }

  public checkDappStatus(): Promise<void> {
    return new Promise((resolve, reject) => {
      let retry = 0;
      const interval = setInterval(() => {
        this.logger.log(JSON.stringify(this.peerMeta));
        if (this.peerMeta) {
          clearInterval(interval);
          return resolve();
        }

        retry++;

        if (retry >= 10) {
          clearInterval(interval);
          const error = this.translate.instant(
            'Dapp not responding. Try scanning a new QR code'
          );
          this.errorsProvider.showDefaultError(
            error,
            this.translate.instant('Could not connect')
          );
          return reject(error);
        }
      }, 1000);
    });
  }

  public async getConnectionData() {
    return {
      connected: this.connected,
      peerMeta: this.peerMeta,
      walletId: this.walletId,
      requests: await this.getPendingRequests(),
      address: this.address,
      activeChainId: this.activeChainId
    };
  }

  public getReduceConnectionData() {
    return {
      peerMeta: this.peerMeta,
      walletId: this.walletId
    };
  }

  public resetConnectionData() {
    this.peerMeta = null;
  }

  public getPendingRequests() {
    return this.persistenceProvider.getWalletConnectPendingRequests();
  }

  public async setAccountInfo(wallet) {
    this.activeChainId =
      wallet.network === 'livenet' ? MAINNET_CHAIN_ID : KOVAN_CHAIN_ID;
    this.walletId = wallet.credentials.walletId;
    try {
      this.address = await this.walletProvider.getAddress(wallet, false);
    } catch (error) {
      this.errorsProvider.showDefaultError(
        error,
        this.translate.instant('Error getting address')
      );
    }
  }

  public async subscribeToEvents() {
    if (!this.walletConnector) return;
    this.walletConnector.on('session_request', (error, payload) => {
      this.logger.debug('walletConnector.on("session_request")');

      if (error) {
        throw error;
      }

      this.peerMeta = payload.params[0].peerMeta;
      this.events.publish('Update/ConnectionData');
    });

    this.walletConnector.on('session_update', (error, _payload) => {
      this.logger.debug('walletConnector.on("session_update")');

      if (error) {
        throw error;
      }
    });

    this.walletConnector.on('call_request', async (error, payload) => {
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
      const _payload = await this.refEthereumRequests(payload);

      const alreadyExist = _.some(this.requests, request => {
        return request.id === _payload.id;
      });

      if (!alreadyExist) {
        this.requests = (await this.getPendingRequests()) || [];
        this.requests.push(_payload);
        this.requests = _.uniqBy(this.requests, 'id');
        await this.persistenceProvider.setWalletConnectPendingRequests(
          this.requests
        );
        const incoming = this.requests;
        this.events.publish(
          'Update/Requests',
          this.requests,
          incoming.slice(-1)[0]
        );
        this.incomingDataProvider.redir('wc:', {
          wcRequest: payload
        });
      }
    });

    this.walletConnector.on('connect', async (error, _payload) => {
      this.logger.debug('walletConnector.on("connect")');
      if (error) {
        throw error;
      }
      const walletConnectData = {
        session: this.walletConnector.session,
        walletId: this.walletId
      };
      await this.persistenceProvider.setWalletConnect(walletConnectData);

      this.analyticsProvider.logEvent('wallet_connect_connection_success', {});
      this.connected = true;
      this.events.publish('Update/ConnectionData');
      this.events.publish('WalletConnectAdvertisementUpdate', 'connected');
      setTimeout(() => {
        this.events.publish('Update/GoBackToBrowserNotification');
      }, 300);
    });

    this.walletConnector.on('disconnect', (error, _payload) => {
      this.logger.debug('walletConnector.on("disconnect")');
      if (error) {
        throw error;
      }
      this.killSession();
    });
  }

  public getChainData(chainId: number): IProviderData {
    const chainData = supportedProviders.filter(
      (chain: any) => chain.chain_id === chainId
    )[0];

    if (!chainData) {
      throw new Error('ChainId missing or not supported');
    }
    return chainData;
  }

  public async approveSession(): Promise<void> {
    if (this.walletConnector) {
      this.logger.debug('walletConnector.approveSession');
      this.walletConnector.approveSession({
        chainId: this.activeChainId,
        accounts: [this.address]
      });
    }
  }

  public async approveRequest(id, result): Promise<void> {
    if (this.walletConnector) {
      this.logger.debug('walletConnector.approveRequest');
      this.walletConnector.approveRequest({
        id,
        result
      });
      await this.closeRequest(id);
      this.analyticsProvider.logEvent('wallet_connect_action_completed', {});
      this.incomingDataProvider.redir('wc:', {
        activePage: 'WalletConnectRequestDetailsPage'
      });
    }
  }

  public rejectSession(): void {
    if (this.walletConnector) {
      this.logger.debug('walletConnector.rejectSession');
      this.walletConnector.rejectSession();
    }
  }

  private async ping() {
    this.logger.log('Wallet Connect - Ping Connection');
    return new Promise(resolve => {
      try {
        this.walletConnector.approveSession({
          chainId: this.activeChainId,
          accounts: [this.address]
        });
      } catch (err) {
        resolve(err.message === 'Session currently connected');
      }
    });
  }

  public async checkConnection() {
    if (!this.walletConnector) return;

    const isConnected = await this.ping();
    if (isConnected) return;

    // clear out storage
    try {
      localStorage.removeItem('walletconnect');
      await this.persistenceProvider.removeWalletConnect();
      await this.persistenceProvider.removeWalletConnectPendingRequests();
    } catch (err) {
      this.logger.error(err);
    }

    this.logger.log('Cleared Cached WalletConnect Session');
  }

  private async refEthereumRequests(payload) {
    this.logger.debug(`refEthereumRequests ${payload.method}`);
    switch (payload.method) {
      case 'eth_sendTransaction':
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
          : 0;
        // Decode ERC20 approve transaction
        // For any other request the Dapp contract ABI will be needed for decoding the transaction data
        payload.decodedData = this.abiDecoderProvider.decodeERC20Data(
          payload.params[0].data
        );

        if (payload.decodedData && payload.decodedData.name === 'approve') {
          try {
            const allTokens = await this.oneInchProvider.getCurrencies1inch();
            payload.tokenInfo = allTokens.tokens[payload.params[0].to];
          } catch {
            this.logger.warn('Wallet Connect - Token not found');
          }
        }
        break;
      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
      case 'personal_sign':
      case 'eth_sign':
        // nothing
        break;
      default:
        this.errorsProvider.showDefaultError(
          `Not supported method: ${payload.method}`,
          this.translate.instant('Error')
        );
        break;
    }
    return Promise.resolve(payload);
  }

  public async killSession(): Promise<void> {
    if (this.walletConnector) {
      [
        'session_request',
        'session_update',
        'call_request',
        'connect',
        'disconnect'
      ].forEach(event => this.walletConnector.off(event));

      this.walletConnector.off('disconnect');
      this.logger.debug('walletConnector.killSession');
      this.events.publish('WalletConnectAdvertisementUpdate', 'disconnected');
      try {
        this.peerMeta = null;
        this.connected = false;
        localStorage.removeItem('walletconnect');
        this.logger.debug('walletconnect - removed persistence');
        await this.walletConnector.killSession();
        this.walletConnector = null;
        await this.persistenceProvider.removeWalletConnect();
      } catch (error) {
        this.logger.error(error);
      }

      try {
        await this.persistenceProvider.removeWalletConnectPendingRequests();
      } catch (error) {
        this.logger.debug('no pending requests to purge');
      }
      this.events.publish('Update/WalletConnectDisconnected');
      this.logger.debug('walletConnector.killSession complete');
    }
  }

  public async closeRequest(id): Promise<void> {
    try {
      this.requests = (
        await this.persistenceProvider.getWalletConnectPendingRequests()
      ).filter(request => request.id !== id);
      await this.persistenceProvider.setWalletConnectPendingRequests(
        this.requests
      );
      this.events.publish('Update/Requests', this.requests);
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async rejectRequest(requestId): Promise<void> {
    if (this.walletConnector) {
      try {
        this.logger.debug('walletConnector.rejectRequest');
        this.walletConnector.rejectRequest({
          id: requestId,
          error: { message: 'Failed or Rejected Request' }
        });
        await this.closeRequest(requestId);
      } catch (error) {
        this.errorsProvider.showDefaultError(
          error,
          this.translate.instant('Error')
        );
      }
    }
  }

  public isSupportedMethod(method: string): boolean {
    return this.supportedMethods.indexOf(method) > -1;
  }
}
