import { Component, Input } from '@angular/core';

@Component({
  selector: 'wallet-item-content',
  templateUrl: 'wallet-item-content.component.html'
})
export class WalletItemContent {
  @Input()
  wallet: any;

  getBalance(wallet, currency) {
    const lastKnownBalance = this.getLastKownBalance(wallet, currency);
    const availableBalanceStr =
      wallet.cachedStatus &&
      wallet.cachedStatus.availableBalanceStr &&
      wallet.cachedStatus.availableBalanceStr.replace(` ${currency}`, '');
    return availableBalanceStr || lastKnownBalance;
  }

  getLastKownBalance(wallet, currency) {
    return (
      wallet.lastKnownBalance &&
      wallet.lastKnownBalance.replace(` ${currency}`, '')
    );
  }

  hasZeroBalance(wallet, currency) {
    return (
      (wallet.cachedStatus && wallet.cachedStatus.availableBalanceSat === 0) ||
      this.getLastKownBalance(wallet, currency) === '0.00'
    );
  }
}
