import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

//providers
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

//pages
import { TxDetailsPage } from '../../tx-details/tx-details';
import { TxpDetailsPage } from '../../txp-details/txp-details';

import * as _ from 'lodash';

@Component({
  selector: 'page-activity',
  templateUrl: 'activity.html'
})
export class ActivityPage {
  public fetchingNotifications: boolean;
  public addressbook: any;
  public txps: any;
  public notifications: any;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private modalCtrl: ModalController,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private walletProvider: WalletProvider,
    private popupProvider: PopupProvider,
    private translate: TranslateService
  ) {
    this.fetchingNotifications = true;
  }

  public ionViewDidEnter() {
    this.profileProvider
      .getNotifications(50)
      .then((nData: any) => {
        this.fetchingNotifications = false;
        this.notifications = nData.notifications;
        this.profileProvider
          .getTxps({})
          .then((txpsData: any) => {
            this.txps = txpsData.txps;
          })
          .catch(err => {
            this.logger.error(err);
          });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public openNotificationModal(n: any): void {
    const wallet = this.profileProvider.getWallet(n.walletId);

    if (n.txid) {
      this.navCtrl.push(TxDetailsPage, { txid: n.txid, walletId: n.walletId });
    } else {
      const txp = _.find(this.txps, {
        id: n.txpId
      });
      if (txp) {
        const modal = this.modalCtrl.create(
          TxpDetailsPage,
          { tx: txp },
          { showBackdrop: false, enableBackdropDismiss: false }
        );
        modal.present();
      } else {
        this.onGoingProcessProvider.set('loadingTxInfo', true);
        this.walletProvider
          .getTxp(wallet, n.txpId)
          .then(txp => {
            const _txp = txp;
            this.onGoingProcessProvider.set('loadingTxInfo', false);
            const modal = this.modalCtrl.create(
              TxpDetailsPage,
              { tx: _txp },
              { showBackdrop: false, enableBackdropDismiss: false }
            );
            modal.present();
          })
          .catch(err => {
            this.logger.warn('No txp found');
            const title = this.translate.instant('Error');
            const subtitle = this.translate.instant('Transaction not found');
            this.popupProvider.ionicAlert(title, subtitle);
          });
      }
    }
  }
}
