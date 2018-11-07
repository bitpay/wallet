import { BuyCardPage } from './buy-card/buy-card';
import { CardDescriptionComponent } from './buy-card/card-description/card-description';
import { CardDetailsPage } from './card-details/card-details';
import { RedeemInstructionsComponent } from './card-details/redeem-instructions/redeem-instructions';
import { CardTermsComponent } from './card-terms/card-terms';
import { ConfirmCardPurchasePage } from './confirm-card-purchase/confirm-card-purchase';
import { GiftCardSettingsPage } from './gift-card-settings/gift-card-settings';
import { GiftCardsSettingsPage } from './gift-cards-settings/gift-cards-settings';
import { HOME_GIFT_CARD_COMPONENTS } from './home-gift-cards/home-gift-cards';
import { PreloadCardImages } from './preload-card-images/preload-card-images';
import { PURCHASED_CARDS_PAGE_COMPONENTS } from './purchased-cards/purchased-cards';

export const GIFT_CARD_PAGES = [
  BuyCardPage,
  CardDescriptionComponent,
  CardDetailsPage,
  CardTermsComponent,
  ConfirmCardPurchasePage,
  GiftCardSettingsPage,
  GiftCardsSettingsPage,
  ...HOME_GIFT_CARD_COMPONENTS,
  PreloadCardImages,
  ...PURCHASED_CARDS_PAGE_COMPONENTS,
  RedeemInstructionsComponent
];
