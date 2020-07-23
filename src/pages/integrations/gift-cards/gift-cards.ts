import { BuyCardPage } from './buy-card/buy-card';
import { CardDescriptionComponent } from './buy-card/card-description/card-description';
import { CardDetailsPage } from './card-details/card-details';
import { PrintableCardComponent } from './card-details/printable-card/printable-card';
import { RedeemInstructionsComponent } from './card-details/redeem-instructions/redeem-instructions';
import { CardTermsComponent } from './card-terms/card-terms';
import { ConfirmCardPurchasePage } from './confirm-card-purchase/confirm-card-purchase';
import { GiftCardSettingsPage } from './gift-card-settings/gift-card-settings';
import { GiftCardsSettingsPage } from './gift-cards-settings/gift-cards-settings';
import { HOME_GIFT_CARD_COMPONENTS } from './home-gift-cards/home-gift-cards';
import { PhonePage } from './phone/phone';
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
  PhonePage,
  PrintableCardComponent,
  ...PURCHASED_CARDS_PAGE_COMPONENTS,
  RedeemInstructionsComponent
];
