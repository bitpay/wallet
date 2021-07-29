import { Component } from '@angular/core';
import * as _ from 'lodash';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

// Providers
import { Logger } from '../../providers/logger/logger';
@Component({
  selector: 'wallet-selector',
  templateUrl: 'wallet-selector.html'
})
export class WalletSelectorComponent extends ActionSheetParent {
  public walletsByKeys: any[];
  public title: string;
  public selectedWalletId: string;
  public coinbaseData;
  public linkEthTokens: boolean;
  public token;

  constructor(private logger: Logger) {
    super();
  }

  ngOnInit() {
    this.title = this.params.title;
    this.selectedWalletId = this.params.selectedWalletId;
    this.coinbaseData = this.params.coinbaseData;
    this.linkEthTokens = this.params.linkEthTokens;
    this.token = this.params.token;
    this.separateWallets();
  }

  private separateWallets(): void {
    const wallets = this.params.wallets;
    this.walletsByKeys = _.values(_.groupBy(wallets, 'keyId'));
  }

  public optionClicked(option, isCoinbaseAccount?: boolean): void {
    if (!isCoinbaseAccount) this.dismiss(option);
    else {
      const optionClicked = {
        accountSelected: _.find(
          this.coinbaseData.availableAccounts,
          ac => ac.id == option
        ),
        isCoinbaseAccount
      };
      this.dismiss(optionClicked);
    }
  }

  public readMore() {
    this.logger.debug('Read more clicked'); // TODO: add a link or remove this read more
  }
}
