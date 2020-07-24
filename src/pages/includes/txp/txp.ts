import { Component, Input } from '@angular/core';
import { ModalController, NavController } from 'ionic-angular';
import { TimeProvider } from '../../../providers/time/time';

import { TxpDetailsPage } from '../../txp-details/txp-details';

import { ConfirmPage } from '../../send/confirm/confirm';

@Component({
  selector: 'page-txp',
  templateUrl: 'txp.html'
})
export class TxpPage {
  private _tx;
  private _addressbook;
  private _noOpenModal: boolean;

  constructor(
    private timeProvider: TimeProvider,
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) {}

  @Input()
  set tx(tx) {
    this._tx = tx;
  }

  get tx() {
    return this._tx;
  }

  @Input()
  set addressbook(addressbook) {
    this._addressbook = addressbook;
  }

  get addressbook() {
    return this._addressbook;
  }

  @Input()
  set noOpenModal(noOpenModal) {
    this._noOpenModal = noOpenModal;
  }

  get noOpenModal() {
    return this._noOpenModal;
  }

  public createdWithinPastDay(time) {
    return this.timeProvider.withinPastDay(time);
  }

  public openTxpModal(txp): void {
    if (this._noOpenModal) return;
    const modal = this.modalCtrl.create(
      TxpDetailsPage,
      { tx: txp },
      { showBackdrop: false, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(opts => {
      if (opts && opts.multisigContractAddress) {
        this.navCtrl.push(ConfirmPage, opts);
      }
    });
  }
}
