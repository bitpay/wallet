import { Component, Input } from '@angular/core';

@Component({
  selector: 'wallet-item-content',
  templateUrl: 'wallet-item-content.html'
})
export class WalletItemContent {
  @Input()
  wallet: any;

  getBalance(wallet, currency) {
    const lastKnownBalance = this.getLastKownBalance(wallet, currency);
    if (currency === 'XRP') {
      const availableBalanceStr =
        wallet.cachedStatus &&
        wallet.cachedStatus.availableBalanceStr &&
        wallet.cachedStatus.availableBalanceStr.replace(` ${currency}`, '');
      return availableBalanceStr || lastKnownBalance;
    } else {
      const totalBalanceStr =
        wallet.cachedStatus &&
        wallet.cachedStatus.totalBalanceStr &&
        wallet.cachedStatus.totalBalanceStr.replace(` ${currency}`, '');
      return totalBalanceStr || lastKnownBalance;
    }
  }

  getAlternativeBalance(wallet, currency) {
    if (currency === 'XRP') {
      const availableAlternative =
        wallet.cachedStatus && wallet.cachedStatus.availableBalanceAlternative;
      return availableAlternative;
    } else {
      const totalBalanceAlternative =
        wallet.cachedStatus && wallet.cachedStatus.totalBalanceAlternative;
      return totalBalanceAlternative;
    }
  }

  getLastKownBalance(wallet, currency) {
    return (
      wallet.lastKnownBalance &&
      wallet.lastKnownBalance.replace(` ${currency}`, '')
    );
  }

  hasZeroBalance(wallet, currency) {
    return (
      (wallet.cachedStatus &&
        wallet.cachedStatus.totalBalanceAlternative === 0) ||
      this.getLastKownBalance(wallet, currency) === '0.00'
    );
  }
}
