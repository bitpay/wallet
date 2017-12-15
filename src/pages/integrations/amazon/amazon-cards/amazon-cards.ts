import { Component } from '@angular/core';
import { NavParams, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

// Pages
import { AmazonCardDetailsPage } from '../amazon-card-details/amazon-card-details';

// Provider
import { AmazonProvider } from '../../../../providers/amazon/amazon';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-amazon-cards',
  templateUrl: 'amazon-cards.html',
})
export class AmazonCardsPage {

  public giftCards: any;
  public updatingPending: any;
  public card: any;
  public invoiceId;

  constructor(
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
        this.openCardModal(card);
      }
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

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
        if (dataFromStorage.status == 'PENDING' || dataFromStorage.status == 'invalid') {
          this.logger.debug("Creating / Updating gift card");
          this.updatingPending[dataFromStorage.invoiceId] = true;

          this.amazonProvider.createGiftCard(dataFromStorage, (err: any, giftCard: any) => {

            this.updatingPending[dataFromStorage.invoiceId] = false;
            if (err) {
              this.logger.error('Error creating gift card:', err);
              giftCard = {};
              giftCard.status = 'FAILURE';
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
                this.logger.debug("Saving new gift card");
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

    let modal = this.modalCtrl.create(AmazonCardDetailsPage);
    modal.present();

    modal.onDidDismiss(() => {
      this.updatePendingGiftCards();
    })
  }

}
