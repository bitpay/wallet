import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { ExternalLinkProvider, ThemeProvider } from '../../providers';
import {
  getDiscountTextColor,
  Merchant
} from '../../providers/merchant/merchant';

@Component({
  selector: 'merchant-page',
  templateUrl: 'merchant.html'
})
export class MerchantPage {
  merchant: Merchant;

  getDiscountTextColor = getDiscountTextColor;

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    public themeProvider: ThemeProvider
  ) {}

  async ngOnInit() {
    this.merchant = this.navParams.get('merchant');
  }

  goToMerchant() {
    const url = this.merchant.cta
      ? this.merchant.cta.link
      : this.merchant.domains[0];
    this.externalLinkProvider.open(url);
  }
}
