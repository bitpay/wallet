import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { ConfigProvider } from '../config/config';
import { GiftCard } from '../gift-card/gift-card';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class MercadoLibreProvider {
  private credentials;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private logger: Logger,
    private configProvider: ConfigProvider
  ) {
    this.logger.info('MercadoLibreProvider initialized');

    this.credentials = {};
    /*
    * Development: 'testnet'
    * Production: 'livenet'
    */
    this.credentials.NETWORK = 'livenet';
    this.credentials.BITPAY_API_URL =
      this.credentials.NETWORK === 'testnet'
        ? 'https://test.bitpay.com'
        : 'https://bitpay.com';
  }

  public getNetwork() {
    return this.credentials.NETWORK;
  }

  public setCredentials(credentials) {
    this.credentials = credentials;
  }

  public getCardMap() {
    return this.persistenceProvider.getMercadoLibreGiftCards(this.getNetwork());
  }

  public persistCards(cardMap) {
    return this.persistenceProvider.setMercadoLibreGiftCards(
      this.getNetwork(),
      cardMap
    );
  }

  public async getPurchasedCards() {
    const network = this.getNetwork();
    const giftCardMap =
      (await this.persistenceProvider.getMercadoLibreGiftCards(network)) || {};
    const invoiceIds = Object.keys(giftCardMap);
    return invoiceIds
      .map(invoiceId => {
        const card = giftCardMap[invoiceId];
        return { ...card, claimCode: card.pin } as GiftCard;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  public register() {
    this.homeIntegrationsProvider.register({
      name: 'mercadolibre',
      title: 'Mercado Livre Brazil Gift Cards',
      icon: 'assets/img/mercado-libre/mercado-livre-icon.svg',
      show: !!this.configProvider.get().showIntegration['mercadolibre']
    });
  }
}
