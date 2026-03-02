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
import { GiftCardProvider, sortByDisplayName } from '../gift-card/gift-card';
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
    private giftCardProvider: GiftCardProvider
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
      this.giftCardProvider.getAvailableCards(),
      this.directoryProvider.fetchDirectory(),
      this.giftCardProvider.getRecentlyPurchasedBrandNames()
    ]).then(
      ([
        directIntegrations,
        availableGiftCardBrands,
        directory,
        recentlyPurchasedBrandNames
      ]) =>
        buildMerchants(
          directIntegrations,
          availableGiftCardBrands,
          directory,
          recentlyPurchasedBrandNames
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
  availableGiftCardBrands: CardConfig[] = [],
  directory: Directory,
  recentlyPurchasedBrandNames: string[]
): Merchant[] {
  const directIntegrationMerchants = directIntegrations.map(integration => ({
    ...integration,
    hasDirectIntegration: true,
    giftCards: []
  }));
  const giftCardMerchants = availableGiftCardBrands.map(cardConfig => ({
    hasDirectIntegration: false,
    name: cardConfig.name,
    displayName: cardConfig.displayName,
    caption: cardConfig.description,
    featured: cardConfig.featured,
    icon: cardConfig.icon,
    link: cardConfig.website,
    displayLink: cardConfig.website,
    tags: cardConfig.tags || [],
    domains: [cardConfig.website].concat(cardConfig.supportedUrls || []),
    theme: cardConfig.brandColor || cardConfig.logoBackgroundColor,
    instructions: cardConfig.description,
    giftCards: [cardConfig]
  }));
  const allMerchants = [
    ...directIntegrationMerchants,
    ...giftCardMerchants
  ] as Merchant[];
  const recentlyPurchasedAvailableBrandNames = recentlyPurchasedBrandNames.filter(
    brandName =>
      allMerchants.some(merchant => merchant.displayName === brandName)
  );
  const fullDirectory = appendFeaturedGiftCardsToPopularBrands(
    directory,
    availableGiftCardBrands
  );
  return allMerchants
    .map(merchant =>
      appendCategories(
        merchant,
        fullDirectory,
        recentlyPurchasedAvailableBrandNames
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
  recentlyPurchasedBrandNames: string[]
): Merchant {
  const baseCurations = directory.curated
    .map((curation, index) => ({
      ...curation,
      index,
      merchantIndex: curation.merchants.indexOf(merchant.displayName)
    }))
    .filter(curation => curation.merchants.includes(merchant.displayName));
  const curations = recentlyPurchasedBrandNames.includes(merchant.displayName)
    ? [
        {
          displayName: 'Recently Purchased',
          index: -1,
          merchantIndex: recentlyPurchasedBrandNames.indexOf(
            merchant.displayName
          ),
          merchants: recentlyPurchasedBrandNames,
          name: 'recentlyPurchased'
        },
        ...baseCurations
      ]
    : baseCurations;
  return {
    ...merchant,
    categories: directory.categories
      .map((category, index) => ({ ...category, index }))
      .filter(category =>
        category.tags.some(tag => merchant.tags.includes(tag))
      ),
    curations
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
