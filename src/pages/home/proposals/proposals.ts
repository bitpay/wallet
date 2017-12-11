import { Component } from "@angular/core";
import { Logger } from '@nsalaun/ng-logger';
import { ModalController } from 'ionic-angular';

//providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { ProfileProvider } from '../../../providers/profile/profile';

//pages
import { TxpDetailsPage } from '../../txp-details/txp-details';

@Component({
  selector: 'page-proposals',
  templateUrl: 'proposals.html',
})
export class ProposalsPage {

  public fetchingProposals: boolean;
  public addressbook: any;
  public txps: any;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private modalCtrl: ModalController
  ) {
    this.fetchingProposals = true;
  }

  ionViewDidEnter() {
    this.addressBookProvider.list().then((ab: any) => {
      this.addressbook = ab || {};

      this.profileProvider.getTxps(50).then((txpsData) => {
        this.fetchingProposals = false;
        this.txps = txpsData.txps;
      }).catch((err: any) => {
        this.fetchingProposals = false;
        this.logger.error(err);
      });
    }).catch((err: any) => {
      this.logger.error(err);
    });
  }

  public openTxpModal(tx: any): void {
    let modal = this.modalCtrl.create(TxpDetailsPage, { tx: tx }, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
  }

}