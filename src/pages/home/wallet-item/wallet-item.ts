import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Item, ItemSliding } from 'ionic-angular';

export type WalletItemAction = 'send' | 'receive';

@Component({
  selector: 'wallet-item',
  template: `
    <ion-item-sliding #slidingItem>
      <button ion-item (click)="performAction('view')">
        <ion-avatar item-start>
          <img
            [ngClass]="{ testnet: wallet.network === 'testnet' }"
            src="assets/img/currencies/{{wallet.coin}}.svg"
          />
        </ion-avatar>
        <ion-label item-start>
          <div class="primary-text wallet-name ellipsis">{{ wallet.name }}</div>
          <ion-note item-start class="secondary-text">
            {{ wallet.credentials.m }}/{{ wallet.credentials.n }}
          </ion-note>
        </ion-label>
        <ion-note item-end *ngIf="!hasZeroBalance() && !wallet.balanceHidden">
          <div class="primary-text">{{ getBalance() }}</div>
          <div class="secondary-text" *ngIf="wallet.cachedStatus">
            {{ wallet?.cachedStatus.totalBalanceAlternative }}
            {{ wallet?.cachedStatus.alternativeIsoCode }}
          </div>
        </ion-note>
        <ion-note item-end *ngIf="hasZeroBalance() && !wallet.balanceHidden">
          <div class="primary-text">0</div>
          <div class="secondary-text" *ngIf="wallet.cachedStatus">
            0 {{ wallet?.cachedStatus.alternativeIsoCode }}
          </div>
        </ion-note>
        <ion-note item-end>
          <div *ngIf="wallet.balanceHidden">
            [<span translate>Hidden</span>]
          </div>
        </ion-note>
      </button>
      <ion-item-options side="left">
        <button
          class="action action--send"
          ion-button
          (click)="performAction('send')"
        >
          <div class="action__icon"><img src="assets/img/send.svg" /></div>
          <div class="action__text">Send</div>
        </button>
      </ion-item-options>
      <ion-item-options side="right">
        <button
          class="action action--receive"
          ion-button
          (click)="performAction('receive')"
        >
          <div class="action__icon"><img src="assets/img/receive.svg" /></div>
          <div class="action__text">Receive</div>
        </button>
      </ion-item-options>
    </ion-item-sliding>
    <label-tip type="info" *ngIf="!wallet.isComplete()">
      <span label-tip-title translate>Wallet Incomplete</span>
      <div label-tip-body>
        <span translate
          >This wallet is waiting for authorized users/devices to join.</span
        >
      </div>
    </label-tip>
  `
})
export class WalletItem implements OnInit {
  @Input()
  wallet: any;

  @Output()
  action: EventEmitter<{
    wallet: any;
    action: WalletItemAction;
  }> = new EventEmitter();

  @ViewChild(Item)
  item: Item;

  @ViewChild(ItemSliding)
  slidingItem: ItemSliding;

  currency: string;
  lastKnownBalance: string;
  totalBalanceStr: string;

  ngOnInit() {
    this.currency = this.wallet.coin.toUpperCase();
  }

  getBalance() {
    const lastKnownBalance = this.getLastKownBalance();
    const totalBalanceStr =
      this.wallet.cachedStatus &&
      this.wallet.cachedStatus.totalBalanceStr &&
      this.wallet.cachedStatus.totalBalanceStr.replace(` ${this.currency}`, '');
    return totalBalanceStr || lastKnownBalance;
  }

  getLastKownBalance() {
    return (
      this.wallet.lastKnownBalance &&
      this.wallet.lastKnownBalance.replace(` ${this.currency}`, '')
    );
  }

  hasZeroBalance() {
    return (
      (this.wallet.cachedStatus &&
        this.wallet.cachedStatus.totalBalanceSat === 0) ||
      this.getLastKownBalance() === '0.00'
    );
  }

  performAction(action: WalletItemAction) {
    this.action.emit({
      wallet: this.wallet,
      action
    });
    this.slidingItem.close();
  }
}
