import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { timer } from 'rxjs/observable/timer';
import { isDark } from '../color/color';
import {
  DirectIntegration,
  Directory,
  DirectoryCategory,
  DirectoryCuration,
  DirectoryProvider
} from '../directory/directory';
import { sortByDisplayName } from '../gift-card/gift-card';
import { CardConfig, GiftCardDiscount } from '../gift-card/gift-card.types';

export interface Merchant extends DirectIntegration {
  categories: DirectoryCategory[];
  curations: DirectoryCuration[];
  name: string;
  featured?: boolean;
  hasDirectIntegration: boolean;
  giftCards: CardConfig[];
}

@Injectable()
export class MerchantProvider {
  merchantPromise: Promise<Merchant[]>;
  constructor(
    private directoryProvider: DirectoryProvider,
    private events: Events,
  ) {
    this.listenForAuthChanges();
  }
  listenForAuthChanges() {
    const authChangeEvents = [
      'BitPayId/Connected',
      'BitPayId/Disconnected',
      'BitPayId/SettingsChanged',
      'GiftCards/GiftCardPurchased'
    ];
    authChangeEvents.forEach(authChangeEvent =>
      this.events.subscribe(authChangeEvent, () => this.refreshMerchants())
    );
  }
  async refreshMerchants() {
    await timer(1200).toPromise();
    await this.getMerchants(true);
  }
  fetchMerchants() {
    this.merchantPromise = Promise.all([
      this.directoryProvider.fetchDirectIntegrations(),
      this.directoryProvider.fetchDirectory(),
    ]).then(
      ([
        directIntegrations,
        directory,
      ]) =>
        buildMerchants(
          directIntegrations,
          directory,
        )
    );
    return this.merchantPromise;
  }
  getMerchants(bustCache: boolean = false) {
    return this.merchantPromise && !bustCache
      ? this.merchantPromise
      : this.fetchMerchants();
  }
}

export function buildMerchants(
  directIntegrations: DirectIntegration[] = [],
  directory: Directory,
): Merchant[] {
  const directIntegrationMerchants = directIntegrations.map(integration => ({
    ...integration,
    hasDirectIntegration: true,
    giftCards: []
  }));
  const allMerchants = [
    ...directIntegrationMerchants,
  ] as Merchant[];
  const fullDirectory = appendFeaturedGiftCardsToPopularBrands(
    directory,
  );
  return allMerchants
    .map(merchant =>
      appendCategories(
        merchant,
        fullDirectory,
      )
    )
    .sort(sortByDisplayName);
}

export function appendFeaturedGiftCardsToPopularBrands(
  directory: Directory,
  availableGiftCards: CardConfig[] = []
): Directory {
  const popularBrands = directory.curated.find(
    curation => curation.name === 'popularBrands'
  );
  const popularAndFeaturedBrands: DirectoryCuration = {
    ...popularBrands,
    merchants: [
      ...new Set([
        ...popularBrands.merchants,
        ...availableGiftCards
          .filter(cardConfig => cardConfig.featured)
          .map(brand => brand.displayName)
      ])
    ].sort((a, b) => sortByDisplayName({ displayName: a }, { displayName: b }))
  };
  return {
    ...directory,
    curated: directory.curated.map(curation =>
      curation.name === 'popularBrands' ? popularAndFeaturedBrands : curation
    )
  };
}

export function appendCategories(
  merchant: Merchant,
  directory: Directory,
): Merchant {
  const baseCurations = directory.curated
    .map((curation, index) => ({
      ...curation,
      index,
      merchantIndex: curation.merchants.indexOf(merchant.displayName)
    }))
    .filter(curation => curation.merchants.includes(merchant.displayName));
  baseCurations;
  return {
    ...merchant,
    categories: directory.categories
      .map((category, index) => ({ ...category, index }))
      .filter(category =>
        category.tags.some(tag => merchant.tags.includes(tag))
      ),
  };
}

export function getGiftCardDiscount(
  merchant: Merchant
): GiftCardDiscount | undefined {
  const cardConfig = merchant.giftCards[0];
  return cardConfig && cardConfig.discounts && cardConfig.discounts[0];
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getDiscount(merchant: Merchant) {
  return merchant.discount || getGiftCardDiscount(merchant);
}

export function getDiscountTextColor(
  merchant: Merchant,
  appTheme: string = 'Light Mode'
): string {
  return merchant.theme === '#ffffff' ||
    merchant.theme === '#000000' ||
    (appTheme === 'Dark Mode' && isDark(merchant.theme))
    ? '#4f6ef7'
    : merchant.theme;
}
