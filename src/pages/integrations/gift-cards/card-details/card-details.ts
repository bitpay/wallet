import {
  animate,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';
import { Component, ViewChild } from '@angular/core';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Events, NavController, NavParams } from 'ionic-angular';
import { take } from 'rxjs/operators';
import {
  ActionSheetProvider,
  InfoSheetType
} from '../../../../providers/action-sheet/action-sheet';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { GiftCardProvider } from '../../../../providers/gift-card/gift-card';
import {
  CardConfig,
  ClaimCodeType,
  GiftCard
} from '../../../../providers/gift-card/gift-card.types';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PrintableCardComponent } from './printable-card/printable-card';
@Component({
  selector: 'card-details-page',
  templateUrl: 'card-details.html',
  animations: [
    trigger('enterAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms 250ms ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('400ms 250ms ease', style({ opacity: 0 }))
      ])
    ]),
    trigger('preventInitialChildAnimations', [
      transition(':enter', [query(':enter', [], { optional: true })])
    ])
  ]
})
export class CardDetailsPage {
  public card: GiftCard;
  public cardConfig: CardConfig;
  ClaimCodeType = ClaimCodeType;

  @ViewChild(PrintableCardComponent)
  printableCard: PrintableCardComponent;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private giftCardProvider: GiftCardProvider,
    private nav: NavController,
    private navParams: NavParams,
    private events: Events,
    private socialSharing: SocialSharing,
    private platformProvider: PlatformProvider
  ) {}

  async ngOnInit() {
    this.card = this.navParams.get('card');
    this.cardConfig = await this.giftCardProvider.getCardConfig(this.card.name);
    this.updateGiftCard();
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', this.bwsEventHandler);
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent', this.bwsEventHandler);
  }

  private bwsEventHandler: any = (_, type: string) => {
    if (type == 'NewBlock') {
      this.updateGiftCard();
    }
  };

  updateGiftCard() {
    this.giftCardProvider
      .updatePendingGiftCards(
        [this.card],
        this.cardConfig.defaultClaimCodeType === ClaimCodeType.barcode &&
          !this.card.barcodeImage
      )
      .pipe(take(1))
      .subscribe(card => (this.card = card));
  }

  doRefresh(refresher) {
    this.updateGiftCard();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }

  copyCode(code: string) {
    this.actionSheetProvider
      .createInfoSheet('copied-gift-card-claim-code', {
        cardConfig: this.cardConfig,
        claimCode: code
      })
      .present();
  }

  showClaimLinkUI() {
    return (
      this.cardConfig &&
      this.card &&
      (this.cardConfig.defaultClaimCodeType === 'link' ||
        !this.card.claimCode) &&
      this.card.status === 'SUCCESS'
    );
  }

  showBarcode() {
    return (
      this.cardConfig &&
      this.cardConfig.defaultClaimCodeType === ClaimCodeType.barcode
    );
  }

  async archive() {
    await this.giftCardProvider.archiveCard(this.card);
    this.nav.pop();
  }

  async unarchive() {
    await this.giftCardProvider.unarchiveCard(this.card);
  }

  hasPin() {
    const legacyCards: string[] = [
      'Amazon.com',
      'Amazon.co.jp',
      'Mercado Livre'
    ];
    const shouldHidePin = this.cardConfig && this.cardConfig.hidePin;
    const pin = this.card && this.card.pin;
    return !shouldHidePin && pin && legacyCards.indexOf(this.card.name) === -1
      ? true
      : false;
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
    const redeemUrl = `${this.cardConfig.redeemUrl}${this.card.claimCode}`;
    this.cardConfig.redeemUrl
      ? this.externalLinkProvider.open(redeemUrl)
      : this.claimManually();
  }

  claimManually() {
    this.cardConfig.printRequired
      ? this.print()
      : this.copyCode(this.card.claimCode);
  }

  print() {
    this.platformProvider.isCordova ? this.printCordova() : window.print();
  }

  printCordova() {
    const image = this.printableCard.getPrintableImage();
    this.platformProvider.isAndroid
      ? this.openExternalLink(this.card.claimLink)
      : this.socialSharing.share(null, 'gift-card', image);
  }

  viewRedemptionCode() {
    this.externalLinkProvider.open(this.card.claimLink);
  }

  showInvoice() {
    this.externalLinkProvider.open(this.card.invoiceUrl);
  }

  private shareCode() {
    this.socialSharing.share(this.card.claimLink || this.card.claimCode);
  }

  showMoreOptions() {
    const showShare =
      this.platformProvider.isCordova &&
      (this.card.claimLink || this.card.claimCode);
    const hidePrint = !this.card.claimLink && this.platformProvider.isAndroid;
    const sheet = this.actionSheetProvider.createOptionsSheet(
      'gift-card-options',
      {
        card: this.card,
        hidePrint,
        showShare
      }
    );
    sheet.present();
    sheet.onDidDismiss(data => {
      switch (data) {
        case 'archive':
          return this.openArchiveSheet();
        case 'unarchive':
          return this.unarchive();
        case 'view-invoice':
          return this.showInvoice();
        case 'share-code':
          return this.shareCode();
        case 'print-card':
          return setTimeout(() => this.print(), 200);
      }
    });
  }
}
