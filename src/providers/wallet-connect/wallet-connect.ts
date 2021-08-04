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
import { IncomingDataProvider } from '../incoming-data/incoming-data';

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
    private bwcProvider: BwcProvider
  ) {
    this.logger.debug('WalletConnect Provider initialized');
  }

  public signTypedData(data: any, wallet) {
    const key = this.keyProvider.getKey(wallet.keyId).get();
    const bitcore = this.bwcProvider.getBitcore();
    const xpriv = new bitcore.HDPrivateKey(key.xPrivKey);
    const priv = xpriv.deriveChild("m/44'/60'/0'/0/0").privateKey;
    const result = signTypedData_v4(Buffer.from(priv.toString(), 'hex'), {
      data
    });
    return result;
  }

  public personalSign(data: any, wallet) {
    const key = this.keyProvider.getKey(wallet.keyId).get();
    const bitcore = this.bwcProvider.getBitcore();
    const xpriv = new bitcore.HDPrivateKey(key.xPrivKey);
    const priv = xpriv.deriveChild("m/44'/60'/0'/0/0").privateKey;
    const result = personalSign(Buffer.from(priv.toString(), 'hex'), {
      data
    });
    return result;
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
      setTimeout(() => {
        if (this.peerMeta) return resolve();

        this.killSession();

        const error = this.translate.instant(
          'Dapp not responding. Try scanning a new QR code'
        );
        this.errorsProvider.showDefaultError(
          error,
          this.translate.instant('Could not connect')
        );
        return reject(error);
      }, 10000);
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
      const _payload = this.refEthereumRequests(payload);

      const alreadyExist = _.some(this.requests, request => {
        return request.id === _payload;
      });

      if (!alreadyExist) {
        this.requests = (await this.getPendingRequests()) || [];
        this.requests.push(_payload);
        this.requests = _.uniqBy(this.requests, 'id');
        await this.persistenceProvider.setWalletConnectPendingRequests(
          this.requests
        );
        this.events.publish('Update/Requests', this.requests);
        this.incomingDataProvider.redir('wc:', { wcRequest: payload });
      }
    });

    this.walletConnector.on('connect', (error, _payload) => {
      this.logger.debug('walletConnector.on("connect")');
      if (error) {
        throw error;
      }

      this.analyticsProvider.logEvent('wallet_connect_connection_success', {});
      this.connected = true;
      this.events.publish('Update/ConnectionData');
    });

    this.walletConnector.on('disconnect', (error, _payload) => {
      this.logger.debug('walletConnector.on("disconnect")');
      if (error) {
        throw error;
      }
      this.connected = false;
      this.events.publish('Update/ConnectionData');
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
      const walletConnectData = {
        session: this.walletConnector.session,
        walletId: this.walletId
      };
      await this.persistenceProvider.setWalletConnect(walletConnectData);
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

  private refEthereumRequests(payload) {
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
        break;
      case 'eth_signTypedData':
        // nothing
        break;
      case 'personal_sign':
        // nothing
        break;
      default:
        this.errorsProvider.showDefaultError(
          `Not supported method: ${payload.method}`,
          this.translate.instant('Error')
        );
        break;
    }
    return payload;
  }

  public async killSession(): Promise<void> {
    if (this.walletConnector) {
      this.logger.debug('walletConnector.killSession');
      this.persistenceProvider.removeWalletConnect();
      this.persistenceProvider.removeWalletConnectPendingRequests();
      await this.walletConnector.killSession();
      this.peerMeta = null;
      this.connected = false;
    }
  }

  public async closeRequest(id): Promise<void> {
    try {
      const filteredRequests = this.requests.filter(
        request => request.id !== id
      );
      this.requests = filteredRequests;
      await this.persistenceProvider.setWalletConnectPendingRequests(
        this.requests
      );
      this.events.publish('Update/Requests', this.requests);
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async rejectRequest(request): Promise<void> {
    if (this.walletConnector) {
      try {
        this.logger.debug('walletConnector.rejectRequest');
        this.walletConnector.rejectRequest({
          id: request.id,
          error: { message: 'Failed or Rejected Request' }
        });
        await this.closeRequest(request.id);
      } catch (error) {
        this.errorsProvider.showDefaultError(
          error,
          this.translate.instant('Error')
        );
      }
    }
  }
}
