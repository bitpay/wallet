import { Component, Input, OnInit } from '@angular/core';
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

@Component({
  selector: 'bitpay-card-home',
  templateUrl: 'bitpay-card-home.html'
})
export class BitPayCardHome implements OnInit {
  public appName: string;
  public firstViewCardPhases: string;
  public disableAddCard: boolean;
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
