import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

// Provider
import { AmazonProvider } from '../../../../providers/amazon/amazon';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from "../../../../providers/on-going-process/on-going-process";
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-amazon-card-details',
  templateUrl: 'amazon-card-details.html',
})
export class AmazonCardDetailsPage {

  public updateGiftCard: boolean;
  public card: any;

  constructor(
    private amazonProvider: AmazonProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private viewCtrl: ViewController
  ) {
    this.card = this.navParams.data.card;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AmazonCardDetailsPage');
  }

  public cancelGiftCard(): void {
    this.onGoingProcessProvider.set('cancelingGiftCard', true);
    this.amazonProvider.cancelGiftCard(this.card, (err: any, data: any) => {
      this.onGoingProcessProvider.set('cancelingGiftCard', false);
      if (err) {
        this.popupProvider.ionicAlert('Error canceling gift card', this.bwcErrorProvider.msg(err));
        return;
      }
      this.card.cardStatus = data.cardStatus;
      this.amazonProvider.savePendingGiftCard(this.card, null, (err: any) => {
        this.refreshGiftCard();
      });
    });
  }

  public remove(): void {
    this.amazonProvider.savePendingGiftCard(this.card, {
      remove: true
    }, (err: any) => {
      this.cancel();
    });
  }

  public refreshGiftCard(): void {
    if (!this.updateGiftCard) return;
    this.onGoingProcessProvider.set('updatingGiftCard', true);
    this.amazonProvider.getPendingGiftCards((err: any, gcds: any) => {
      this.onGoingProcessProvider.set('updatingGiftCard', false);
      if (err) {
        this.popupProvider.ionicAlert('Error', err);
        return;
      }
      _.forEach(gcds, function (dataFromStorage) {
        if (dataFromStorage.invoiceId == this.card.invoiceId) {
          this.logger.debug("creating gift card");
          this.amazonProvider.createGiftCard(dataFromStorage, (err: any, giftCard: any) => {
            if (err) {
              this.popupProvider.ionicAlert('Error', this.bwcErrorProvider.msg(err));
              return;
            }
            if (!_.isEmpty(giftCard) && giftCard.status != 'PENDING') {
              var newData: any = {};
              _.merge(newData, dataFromStorage, giftCard);

              if (newData.status == 'expired') {
                this.amazonProvider.savePendingGiftCard(newData, {
                  remove: true
                }, (err: any) => {
                  this.cancel();
                });
                return;
              }

              this.amazonProvider.savePendingGiftCard(newData, null, (err: any) => {
                this.logger.debug("Amazon gift card updated");
                this.card = newData;
              });
            } else this.logger.debug("Pending gift card not available yet");
          });
        }
      });
    });
  }

  public cancel(): void {
    this.viewCtrl.dismiss();
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

}

