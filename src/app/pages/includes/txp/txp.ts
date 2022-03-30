import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

// Providers
import { Contact } from '../../../providers/address-book/address-book';
import { TimeProvider } from '../../../providers/time/time';
import { TxpDetailsPage } from '../../txp-details/txp-details';

// Pages
import { ConfirmPage } from '../../send/confirm/confirm';

import _ from 'lodash';
import { ModalController, NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'page-txp',
  templateUrl: 'txp.html',
  styleUrls: ['./txp.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TxpPage implements OnInit {
  private _tx;
  private _addressbook: Contact[];
  private _noOpenModal: boolean;

  public contactName: string;

  constructor(
    private timeProvider: TimeProvider,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router,
    public toastController: ToastController
  ) { }

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

  public async openTxpModal(txp): Promise<void> {
    if (this._noOpenModal) return;
    const modal = await this.modalCtrl.create({
      component: TxpDetailsPage,
      componentProps: { tx: txp },
      showBackdrop: false,
      backdropDismiss: false
    });
    await modal.present();
    modal.onDidDismiss().then(({ data }) => {
      if (data && data.multisigContractAddress) {
        this.router.navigate(['/confirm'], { state: data });
      }
      if (data && data.finishText) {
        this.presentToast(data.finishText);
      }
    });
  }

  async presentToast(finishText) {
    const toast = await this.toastController.create({
      message: finishText,
      duration: 3000,
      position: 'top',
      animated: true,
      cssClass: 'custom-finish-toast',
      buttons: [
        {
          side: 'start',
          icon: 'checkmark-circle',
          handler: () => {
            console.log('');
          }
        }
      ]
    });
    toast.present();
  }

  private getContact(addr: string, coin: string) {
    const existsContact = _.find(
      this.addressbook,
      c => c.address === addr && c.coin === coin
    );
    if (existsContact) return existsContact.name;
    return undefined;
  }

  converDate(number) {
    return new Date(number);
  }
}
