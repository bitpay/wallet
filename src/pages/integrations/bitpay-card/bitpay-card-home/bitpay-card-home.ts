import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
// Providers
import {
  AppProvider,
  IABCardProvider,
  PersistenceProvider
} from '../../../../providers';

// Pages
import { BitPayCardPage } from '../bitpay-card';
import { BitPayCardIntroPage } from '../bitpay-card-intro/bitpay-card-intro';
import { PhaseOneCardIntro } from '../bitpay-card-phases/phase-one/phase-one-intro-page/phase-one-intro-page';
import { trigger, transition, style, animate } from '@angular/animations';

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
  public disableAddCard: boolean;
  public ready: boolean;

  @Input() showBitpayCardGetStarted: boolean;
  @Input() public bitpayCardItems: any;
  @Input() cardExperimentEnabled: boolean;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private iabCardProvider: IABCardProvider,
    private events: Events,
    private persistenceProvider: PersistenceProvider
  ) {}

  ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
    this.events.subscribe('reachedCardLimit', () => {
      this.disableAddCard = true;
    });
    this.persistenceProvider.getReachedCardLimit().then(limitReached => {
      if (limitReached) {
        this.disableAddCard = true;
      }
    });
    setTimeout( () => {
      this.ready = true;
    });
  }

  ngOnChanges(changes: SimpleChanges) {

    const prev = changes['bitpayCardItems'].previousValue;
    const curr = changes['bitpayCardItems'].currentValue;
    if((!prev && curr) || (prev && !curr) || (curr.length > prev.length)) {
      this.ready = false;
      setTimeout( () => {
        this.ready = true;
      });
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
      this.iabCardProvider.sendMessage(
        {
          message
        },
        () => {
          this.iabCardProvider.show();
        }
      );
    } else {
      this.navCtrl.push(BitPayCardPage, { id: cardId });
    }
  }
}
