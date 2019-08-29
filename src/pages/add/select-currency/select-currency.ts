import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// pages

import { CreateWalletPage } from '../create-wallet/create-wallet';

import { Config, ConfigProvider } from '../../../providers/config/config';
import { TokenMap } from './token-map';
@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  public coin: string;
  public enabledTokens: Config['enabledTokens'];
  public displayList: Config['enabledTokens'];
  public tokenList: Config['enabledTokens'];
  public addedToken = {};
  private tokenMap = TokenMap;
  constructor(
    private configProvider: ConfigProvider,
    private navCtrl: NavController,
    private logger: Logger,
    private navParam: NavParams
  ) {
    this.tokenList = Object.keys(this.tokenMap).map(
      token => this.tokenMap[token]
    );
    this.updateEnabledTokens();
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
  }

  private updateEnabledTokens() {
    this.enabledTokens = this.configProvider.get().enabledTokens;
    for (const token of this.enabledTokens) {
      this.addedToken[token.address] = token;
    }
  }

  public goToCreateWallet(coin: string): void {
    this.navCtrl.push(CreateWalletPage, {
      isShared: this.navParam.data.isShared,
      coin,
      keyId: this.navParam.data.keyId
    });
  }

  public toggleToken(tokenAddress: string) {
    const existingToken = this.enabledTokens.filter(
      token => token.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    const { name, symbol, decimal } = this.tokenMap[tokenAddress];
    let opts = {};
    if (existingToken.length === 0) {
      opts = {
        enabledTokens: [
          ...this.enabledTokens,
          { name, symbol, decimal, address: tokenAddress }
        ]
      };
    } else {
      const deletedTokenList = this.enabledTokens.filter(
        token => token.address.toLowerCase() !== tokenAddress.toLowerCase()
      );
      opts = {
        enabledTokens: deletedTokenList
      };
    }
    this.configProvider.deleteTokens(opts);
    this.updateEnabledTokens();
  }
}
