import { Component, Input, ViewEncapsulation } from '@angular/core';
import { DecimalFormatBalance } from 'src/app/providers/decimal-format.ts/decimal-format';

@Component({
  selector: 'wallet-item-content',
  templateUrl: 'wallet-item-content.html',
  styleUrls: ['wallet-item-content.scss'],
  encapsulation : ViewEncapsulation.None
})
export class WalletItemContent {
  @Input()
  wallet: any;

  @Input()
  isCustomForAddressBook = false;

  @Input()
  isLastChild = false;

  @Input()
  coins: any;

  @Input()
  isKeyTab: any;

  @Input()
  isShowBalance: any = true;
  
  getBalance(wallet, currency) {
    const lastKnownBalance = this.getLastKownBalance(wallet, currency);
    const totalBalanceStr =
      wallet.cachedStatus &&
      wallet.cachedStatus.totalBalanceStr &&
      wallet.cachedStatus.totalBalanceStr.replace(` ${currency}`, '');

    // New created wallet does not have "lastkKnownBalance"
    if (
      totalBalanceStr == '0.00' &&
      (lastKnownBalance == '0.00' || !lastKnownBalance)
    )
      return '0';
    return DecimalFormatBalance(totalBalanceStr) || DecimalFormatBalance(lastKnownBalance);
  }

  getBalanceChange(unitCode) {
    const coin = this.coins.find(ele => {
      return ele.unitCode === unitCode;
    });
    const totalBalanceChange = coin.totalBalanceChange ? coin.totalBalanceChange : 0;
    return totalBalanceChange;
  }

  getAlternativeBalance(wallet, currency) {
    const totalBalanceAlternative =
      wallet.cachedStatus && wallet.cachedStatus.totalBalanceAlternative;
    if (totalBalanceAlternative == '0.00') return '0';
    return DecimalFormatBalance(totalBalanceAlternative);
  }

  getLastKownBalance(wallet, currency) {
    return (
      wallet.lastKnownBalance &&
      wallet.lastKnownBalance.replace(` ${currency}`, '')
    );
  }
}
