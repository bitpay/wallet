import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import {
  ActionSheetProvider,
  InfoSheetType
} from '../../../../providers/action-sheet/action-sheet';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import {
  CardConifg,
  GiftCard,
  GiftCardProvider
} from '../../../../providers/gift-card/gift-card';

@Component({
  selector: 'card-details-page',
  templateUrl: 'card-details.html'
})
export class CardDetailsPage {
  public card: GiftCard;
  public cardConfig: CardConifg;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private giftCardProvider: GiftCardProvider,
    private nav: NavController,
    private navParams: NavParams,
    private events: Events
  ) {}

  async ngOnInit() {
    this.card = this.navParams.get('card');
    this.cardConfig = await this.giftCardProvider.getCardConfig(this.card.name);
    this.updateGiftCard();
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', (_, type: string) => {
      if (type == 'NewBlock') {
        this.updateGiftCard();
      }
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  updateGiftCard() {
    this.giftCardProvider
      .updatePendingGiftCards([this.card])
      .subscribe(card => (this.card = card));
  }

  doRefresh(refresher) {
    this.updateGiftCard();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }

  copyClaimCode() {
    this.actionSheetProvider
      .createInfoSheet('copied-gift-card-claim-code', {
        claimCode: this.card.claimCode,
        website: this.cardConfig.website
      })
      .present();
  }

  async archive() {
    await this.giftCardProvider.archiveCard(this.card);
    this.nav.pop();
    this.showInfoSheet('gift-card-archived');
  }

  openArchiveSheet() {
    this.showInfoSheet('archive-gift-card', () => this.archive());
  }

  showInfoSheet(
    sheetName: InfoSheetType,
    onDidDismiss: (confirm?: boolean) => void = () => {}
  ) {
    const sheet = this.actionSheetProvider.createInfoSheet(sheetName);
    sheet.present();
    sheet.onDidDismiss(confirm => confirm && onDidDismiss(confirm));
  }

  openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  redeem() {
    this.cardConfig.redeemUrl
      ? this.externalLinkProvider.open(
          `${this.cardConfig.redeemUrl}${this.card.claimCode}`
        )
      : this.copyClaimCode();
  }

  showInvoice() {
    this.externalLinkProvider.open(this.card.invoiceUrl);
  }

  showMoreOptions() {
    const sheet = this.actionSheetProvider.createOptionsSheet(
      'gift-card-options'
    );
    sheet.present();
    sheet.onDidDismiss(data => {
      switch (data) {
        case 'archive':
          return this.openArchiveSheet();
        case 'view-invoice':
          return this.showInvoice();
      }
    });
  }
}
