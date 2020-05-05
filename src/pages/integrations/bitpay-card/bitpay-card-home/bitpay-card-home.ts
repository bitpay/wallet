import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
// Providers
import { AppProvider, IABCardProvider } from '../../../../providers';

// Pages
import { animate, style, transition, trigger } from '@angular/animations';
import { BitPayCardPage } from '../bitpay-card';
import { BitPayCardIntroPage } from '../bitpay-card-intro/bitpay-card-intro';
import { PhaseOneCardIntro } from '../bitpay-card-phases/phase-one/phase-one-intro-page/phase-one-intro-page';

@Component({
  selector: 'bitpay-card-home',
  templateUrl: 'bitpay-card-home.html',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({
          transform: 'translateY(5px)',
          opacity: 0
        }),
        animate('200ms')
      ])
    ])
  ]
})
export class BitPayCardHome implements OnInit {
  public appName: string;
  public firstViewCardPhases: string;
  public disableAddCard = true;
  public isFetching: boolean;
  public ready: boolean;
  private _initial = true;
  @Input() showBitpayCardGetStarted: boolean;
  @Input() bitpayCardItems: any;
  @Input() cardExperimentEnabled: boolean;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private iabCardProvider: IABCardProvider,
    private events: Events
  ) {
    this.events.subscribe('reachedCardLimit', () => {
      this.disableAddCard = true;
    });
    this.events.subscribe('isFetchingDebitCards', status => {
      this.isFetching = status;
    });
  }

  ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
    setTimeout(() => {
      this.ready = true;
      this._initial = false;
      this.disableAddCard =
        this.bitpayCardItems &&
        this.bitpayCardItems.find(c => c.provider === 'galileo');
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._initial) {
      return;
    }

    const prev = changes['bitpayCardItems'].previousValue;
    const curr = changes['bitpayCardItems'].currentValue;
    if (
      (!prev && curr) ||
      (prev && !curr) ||
      (curr && prev && curr.length > prev.length)
    ) {
      this.ready = false;
      setTimeout(() => {
        this.ready = true;
      }, 50);
    }
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(
      this.cardExperimentEnabled ? BitPayCardIntroPage : PhaseOneCardIntro
    );
  }

  public goToCard(cardId): void {
    if (this.cardExperimentEnabled) {
      const message = `loadDashboard?${cardId}`;
      this.iabCardProvider.show();
      this.iabCardProvider.sendMessage(
        {
          message
        },
        () => {}
      );
    } else {
      this.navCtrl.push(BitPayCardPage, { id: cardId });
    }
  }
}
