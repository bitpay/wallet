import { Component } from '@angular/core';
import { NavParams, ModalController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';
import * as _ from 'lodash';

// Pages
import { AmazonCardDetailsPage } from '../amazon-card-details/amazon-card-details';

// Provider
import { AmazonProvider } from '../../../../providers/amazon/amazon';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';
import { TimeProvider } from '../../../../providers/time/time';

@Component({
  selector: 'page-amazon-cards',
  templateUrl: 'amazon-cards.html',
})
export class AmazonCardsPage {

  private updateGiftCard: boolean;
  public giftCards: any;
  public updatingPending: any;
  public card: any;
  public invoiceId;

  constructor(
    private timeProvider: TimeProvider,
    private amazonProvider: AmazonProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AmazonCardsPage');
    this.updatePendingGiftCards();
  }

  ionViewWillEnter() {
    this.invoiceId = this.navParams.data.invoiceId;
    this.updateGiftCards().then(() => {
      if (this.invoiceId) {
        let card = _.find(this.giftCards, {
          invoiceId: this.invoiceId
        });
        if (_.isEmpty(card)) {
          this.popupProvider.ionicAlert(null, 'Card not found');
          return;
        }
        this.updateGiftCard = this.checkIfCardNeedsUpdate(card);
        this.openCardModal(card);
      }
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private checkIfCardNeedsUpdate(card: any) {
    // Continues normal flow (update card)
    if (card.status == 'PENDING' || card.status == 'invalid') {
      return true;
    }
    // Check if card status FAILURE for 24 hours
    if (card.status == 'FAILURE' && this.timeProvider.withinPastDay(card.date)) {
      return true;
    }
    // Success: do not update
    return false;
  };

  private updateGiftCards(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.amazonProvider.getPendingGiftCards((err: any, gcds: any) => {
        if (err) {
          this.popupProvider.ionicAlert('Could not get gift cards', err);
          return reject(err);
        }
        this.giftCards = gcds;
        return resolve();
      });
    });
  }

  public updatePendingGiftCards = _.debounce(() => {
    this.updatingPending = {};
    this.updateGiftCards().then(() => {
      let gcds = this.giftCards;
      _.forEach(gcds, (dataFromStorage: any) => {

        this.updateGiftCard = this.checkIfCardNeedsUpdate(dataFromStorage);

        if (this.updateGiftCard) {
          this.logger.debug("Creating / Updating gift card");
          this.updatingPending[dataFromStorage.invoiceId] = true;

          this.amazonProvider.createGiftCard(dataFromStorage, (err: any, giftCard: any) => {

            this.updatingPending[dataFromStorage.invoiceId] = false;
            if (err) {
              this.logger.error('Error creating gift card:', err);
              giftCard = giftCard || {};
              giftCard['status'] = 'FAILURE';
            }

            if (giftCard.status != 'PENDING') {
              let newData: any = {};

              _.merge(newData, dataFromStorage, giftCard);

              if (newData.status == 'expired') {
                this.amazonProvider.savePendingGiftCard(newData, {
                  remove: true
                }, (err: any) => {
                  this.updateGiftCards();
                });
                return;
              }

              this.amazonProvider.savePendingGiftCard(newData, null, (err: any) => {
                this.logger.debug("Amazon gift card updated");
                this.updateGiftCards();
              });
            }
          });
        }
      });
    }).catch((err: any) => {
      this.logger.error(err);
    });

  }, 1000, {
      'leading': true
    });

  public openCardModal(card: any): void {
    this.card = card;

    let modal = this.modalCtrl.create(AmazonCardDetailsPage, { card: this.card, updateGiftCard: this.updateGiftCard });
    modal.present();

    modal.onDidDismiss(() => {
      this.updatePendingGiftCards();
    })
  }

}
