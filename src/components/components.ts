import { WalletItemContent } from './../pages/home/wallets/wallet-item-content.component';
import { AddressItemContent } from './../pages/settings/addressbook/address-item-content.component';
import { ActionCardComponent } from './action-card/action-card';
import { ACTION_SHEET_COMPONENTS } from './action-sheets';
import { AmountPickerComponent } from './amount-picker/amount-picker';
import { ClipboardCardPage } from './clipboard-card/clipboard-card';
import { EXPANDABLE_HEADER_COMPONENTS } from './expandable-header/expandable-header';
import { LabelTip } from './label-tip/label-tip';
import { PriceCard } from './price-card/price-card';
import { PriceChart } from './price-card/price-chart/price-chart';
import { SearchBarComponent } from './search-bar/search-bar';

export const COMPONENTS = [
  ActionCardComponent,
  ACTION_SHEET_COMPONENTS,
  AmountPickerComponent,
  EXPANDABLE_HEADER_COMPONENTS,
  LabelTip,
  WalletItemContent,
  AddressItemContent,
  ClipboardCardPage,
  SearchBarComponent,
  PriceCard,
  PriceChart
];
