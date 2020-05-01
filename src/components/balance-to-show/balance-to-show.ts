import { Component, Input } from '@angular/core';

@Component({
  selector: 'balance-to-show',
  templateUrl: 'balance-to-show.html'
})
export class BalanceToShowComponent {
  @Input()
  set balance(value: string) {
    this._balance = value;
    this.processBalance(this._balance);
  }

  get balance(): string {
    return this._balance;
  }
  private _balance: string;
  public amount: string;
  public unit: string;
  public resize: boolean;

  constructor() {
    this.resize = false;
  }

  private processBalance(balance: string) {
    if (!balance || balance === '') return;

    this.resize = Boolean(balance.length >= 18);
    if (balance.indexOf(' ') >= 0) {
      const spacePosition = balance.indexOf(' ');
      this.amount = balance.substr(0, spacePosition);
      this.unit = balance.substr(spacePosition, balance.length);
    }
  }
}
