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
    const totalBalanceStr =
      wallet.cachedStatus &&
      wallet.cachedStatus.totalBalanceStr &&
      wallet.cachedStatus.totalBalanceStr.replace(` ${currency}`, '');
    return totalBalanceStr || lastKnownBalance;
  }

  getLastKownBalance(wallet, currency) {
    return (
      wallet.lastKnownBalance &&
      wallet.lastKnownBalance.replace(` ${currency}`, '')
    );
  }

  hasZeroBalance(wallet, currecy) {
    return (
      (wallet.cachedStatus && wallet.cachedStatus.totalBalanceSat === 0) ||
      this.getLastKownBalance(wallet, currecy) === '0.00'
    );
  }
}
