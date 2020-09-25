import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as ethers from 'ethers';

import { ConfigProvider, HomeIntegrationsProvider } from '../../providers';
import { Logger } from '../../providers/logger/logger';
import {
  IProviderData,
  supportedProviders
} from './web3-providers/web3-providers';

@Injectable()
export class WalletConnectProvider {
  constructor(
    private logger: Logger,
    private translate: TranslateService,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('WalletConnect Provider initialized');
  }

  public register(): void {
    this.homeIntegrationsProvider.register({
      name: 'walletConnect',
      title: this.translate.instant('WalletConnect'),
      icon: 'assets/img/wallet-connect.svg',
      showIcon: true,
      logo: null,
      logoWidth: '110',
      background:
        'linear-gradient(to bottom,rgba(60, 63, 69, 1) 0,rgba(45, 47, 51, 1) 100%)',
      page: 'WalletConnectPage',
      show: !!this.configProvider.get().showIntegration['walletConnect'],
      type: 'exchange'
    });
  }

  public getChainData(chainId: number): IProviderData {
    const chainData = supportedProviders.filter(
      (chain: any) => chain.chain_id === chainId
    )[0];

    if (!chainData) {
      throw new Error('ChainId missing or not supported');
    }

    const API_KEY = 'f73d326fec924c34abc4d16233920356';

    if (
      chainData.rpc_url.includes('infura.io') &&
      chainData.rpc_url.includes('%API_KEY%') &&
      API_KEY
    ) {
      const rpcUrl = chainData.rpc_url.replace('%API_KEY%', API_KEY);

      return {
        ...chainData,
        rpc_url: rpcUrl
      };
    }

    return chainData;
  }

  public generateWallet(account: number) {
    /* TODO wrap wallet private key or mnemonic with ethers wallet.
     * Move this function to key.ts in BWC and use that function here.
     */
    const newWallet = ethers.Wallet.fromMnemonic(
      'rhythm egg tube lunar father cattle breeze laugh ask witness real curtain',
      `m/44'/60'/${account}'/0/0`
    );
    return newWallet;
  }
}
