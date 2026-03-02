import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { NavController, NavParams, Slides } from 'ionic-angular';
import * as _ from 'lodash';

import { BuyCardPage } from '../buy-card/buy-card';

import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
  ActionSheetProvider,
  ExternalLinkProvider,
  PlatformProvider,
  ThemeProvider
} from '../../../../providers';
import {
  DirectoryCategory,
  DirectoryCuration
} from '../../../../providers/directory/directory';
import {
  getPromo,
  GiftCardProvider,
  hasVisibleDiscount
} from '../../../../providers/gift-card/gift-card';
import { CardConfig } from '../../../../providers/gift-card/gift-card.types';
import {
  getDiscount,
  getDiscountTextColor,
  Merchant,
  MerchantProvider
} from '../../../../providers/merchant/merchant';
import { MerchantPage } from '../../../merchant/merchant';
import { WideHeaderPage } from '../../../templates/wide-header-page/wide-header-page';

@Component({
  selector: 'card-catalog-page',
  templateUrl: 'card-catalog.html'
})
export class CardCatalogPage extends WideHeaderPage {
  public allMerchants: Merchant[];
  private giftCardsOnly: boolean = false;
  public searchQuery: string = '';
  public searchQuerySubject: Subject<string> = new Subject<string>();
  public visibleMerchants: Merchant[] = [];
  public categories: DirectoryCategory[];
  public curations: Array<{ displayName: string; slides: Merchant[][] }>;
  public category: string;
  public platformProvider: PlatformProvider;
  getDiscountTextColor = getDiscountTextColor;

  @ViewChild(WideHeaderPage)
  wideHeaderPage: WideHeaderPage;

  @ViewChildren(Slides)
  slides: QueryList<Slides>;

  isCordova: boolean = false;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    public externalLinkProvider: ExternalLinkProvider,
    public giftCardProvider: GiftCardProvider,
    private merchantProvider: MerchantProvider,
    platformProvider: PlatformProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    public themeProvider: ThemeProvider
  ) {
    super(platformProvider);
  }

  ngOnInit() {
    this.isCordova = this.platformProvider.isCordova;
    this.category = this.navParams.get('category');
    this.giftCardsOnly = this.navParams.get('giftCardsOnly');
    this.title = this.category
      ? this.category
      : this.giftCardsOnly
      ? 'Gift Cards'
      : 'Shop';
    this.searchQuerySubject.pipe(debounceTime(300)).subscribe(query => {
      this.searchQuery = query as string;
      this.updateCardList();
    });

    this.merchantProvider
      .getMerchants()
      .then(async allMerchants => {
        const merchants = allMerchants.filter(merchant =>
          this.giftCardsOnly ? merchant.giftCards.length : true
        );
        this.allMerchants = merchants;
        if (merchants.length < 10) {
          this.category = 'All';
        }
        this.categories = getUniqueCategoriesOrCurations<DirectoryCategory>(
          this.allMerchants,
          'categories'
        );
        this.curations = buildCurations(this.allMerchants);
        this.updateCardList();
      })
      .catch(_ => {
        this.showError();
        return [] as Merchant[];
      });
  }

  slideChanged(slides: Merchant[][], index: number) {
    const activeSlideIndex = this.slides.toArray()[index].getActiveIndex();
    const visibleCards = slides[activeSlideIndex] || [];
    visibleCards
      .filter(merchant => merchant.giftCards.length)
      .map(merchant => merchant.giftCards[0])
      .filter(cardConfig => hasVisibleDiscount(cardConfig))
      .forEach(promotedCard =>
        this.giftCardProvider.logEvent(
          'presentedWithGiftCardPromo',
          this.giftCardProvider.getPromoEventParams(
            promotedCard,
            'Shop Page Curation'
          )
        )
      );
  }

  getDiscount(merchant: Merchant) {
    return getDiscount(merchant);
  }

  ionViewDidEnter() {
    this.logGiftCardCatalogHomeView();
  }

  onSearch(query: string) {
    this.searchQuerySubject.next(query);
  }

  viewCategory(category: string) {
    this.navCtrl.push(CardCatalogPage, {
      category,
      giftCardsOnly: this.giftCardsOnly
    });
  }

  trackBy(record) {
    return record.name;
  }

  updateCardList() {
    this.visibleMerchants = this.allMerchants
      .filter(merchant => isMerchantInSearchResults(merchant, this.searchQuery))
      .filter(
        merchant =>
          !this.category ||
          this.category === 'All' ||
          [
            ...merchant.categories.map(category => category.displayName),
            ...merchant.curations.map(curation => curation.displayName)
          ].includes(this.category)
      );
  }

  viewMerchant(merchant: Merchant) {
    return merchant.hasDirectIntegration
      ? this.navCtrl.push(MerchantPage, { merchant })
      : this.buyCard(merchant.giftCards[0]);
  }

  buyCard(cardConfig: CardConfig) {
    this.logGiftCardBrandView(cardConfig);

    this.navCtrl.push(BuyCardPage, { cardConfig });
    if (!!getPromo(cardConfig)) {
      this.logPromoClick(cardConfig);
    }
  }

  logGiftCardCatalogHomeView() {
    this.giftCardProvider.logEvent('giftcards_view_home', {});
  }

  logGiftCardBrandView(cardConfig: CardConfig) {
    this.giftCardProvider.logEvent('giftcards_view_brand', {
      brand: cardConfig.name
    });

    this.giftCardProvider.logEvent('view_item', {
      items: [
        {
          brand: cardConfig.name,
          category: 'giftCards'
        }
      ]
    });
  }

  logPromoClick(cardConfig: CardConfig) {
    this.giftCardProvider.logEvent(
      'clickedGiftCardPromo',
      this.giftCardProvider.getPromoEventParams(
        cardConfig,
        this.category ? 'Gift Card List' : 'Shop Page Curation'
      )
    );
  }

  public launchExtension() {
    this.externalLinkProvider.open(
      'https://bitpay.com/extension/?launchExtension=true'
    );
  }

  private showError() {
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'gift-cards-unavailable'
    );
    errorInfoSheet.present();
    errorInfoSheet.onDidDismiss(() => this.navCtrl.pop());
  }
}

function buildCurations(merchants: Merchant[]) {
  const uniqueCurations = getUniqueCategoriesOrCurations<DirectoryCuration>(
    merchants,
    'curations'
  );
  return uniqueCurations.map(curation => ({
    displayName: curation.displayName,
    slides: merchants
      .filter(merchant =>
        merchant.curations
          .map(merchantCuration => merchantCuration.displayName)
          .includes(curation.displayName)
      )
      .sort(
        (a, b) =>
          a.curations.find(c => c.displayName === curation.displayName)
            .merchantIndex -
          b.curations.find(c => c.displayName === curation.displayName)
            .merchantIndex
      )
      .reduce((all, one, i) => {
        const ch = Math.floor(i / 3);
        all[ch] = [].concat(all[ch] || [], one);
        return all;
      }, [])
  }));
}

export function isMerchantInSearchResults(m: Merchant, search: string = '') {
  const merchantName = (m.displayName || m.name).toLowerCase();
  const query = search.toLowerCase();
  const matchableText = [
    merchantName,
    stripPunctuation(merchantName),
    ...m.tags
  ];
  return !search || matchableText.some(text => text.indexOf(query) > -1);
}

export function stripPunctuation(text: string) {
  return text.replace(/[^\w\s]|_/g, '');
}

function getUniqueCategoriesOrCurations<
  T extends DirectoryCategory | DirectoryCuration
>(merchants: Merchant[], field: 'curations' | 'categories'): T[] {
  return (_.uniqBy(
    merchants
      .filter(merchant => merchant[field].length)
      .map(merchant => merchant[field])
      .reduce(
        (allCurations, merchantCurations) => [
          ...allCurations,
          ...merchantCurations
        ],
        []
      ),
    categoryOrCuration => categoryOrCuration.displayName
  ) as T[]).sort((a, b) => a.index - b.index);
}
