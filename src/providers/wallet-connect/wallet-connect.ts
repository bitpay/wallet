import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';

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
    return chainData;
  }
}
