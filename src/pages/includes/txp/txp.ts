import { Component, Input, OnInit } from '@angular/core';
import { ModalController, NavController } from 'ionic-angular';

// Providers
import { Contact } from '../../../providers/address-book/address-book';
import { TimeProvider } from '../../../providers/time/time';
import { TxpDetailsPage } from '../../txp-details/txp-details';

// Pages
import { ConfirmPage } from '../../send/confirm/confirm';

import _ from 'lodash';

@Component({
  selector: 'page-txp',
  templateUrl: 'txp.html'
})
export class TxpPage implements OnInit {
  private _tx;
  private _addressbook: Contact[];
  private _noOpenModal: boolean;

  public contactName: string;

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

  ngOnInit() {
    this.contactName = this.getContact(this._tx.toAddress, this._tx.coin);
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

  private getContact(addr: string, coin: string) {
    const existsContact = _.find(
      this.addressbook,
      c => c.address === addr && c.coin === coin
    );
    if (existsContact) return existsContact.name;
    return undefined;
  }
}
