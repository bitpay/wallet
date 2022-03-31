import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavParams } from '@ionic/angular';
import _ from 'lodash';
import { AppProvider } from 'src/app/providers';
import { ProfileProvider } from 'src/app/providers/profile/profile';
import { SearchContactPage } from '../../search/search-contact/search-contact.component';

@Component({
  selector: 'page-transfer-to-modal',
  templateUrl: 'transfer-to-modal.html',
  styleUrls: ['transfer-to-modal.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TransferToModalPage {
  public search: string = '';
  public wallet;
  public fromSend: boolean;
  public fromMultiSend: boolean;
  public currentTheme: string;
  navParamsData;
  constructor(
    private router: Router,
    private profileProvider: ProfileProvider,
    private navParams: NavParams,
    private viewCtrl: ModalController,
    private appProvider: AppProvider,
    private modalCtrl: ModalController
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navParamsData = history ? history.state : {};
    }
    if (this.navParams && !_.isEmpty(this.navParams.data)) this.navParamsData = this.navParams.data;
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    this.wallet = this.profileProvider.getWallet(this.navParamsData.walletId);
    this.fromSend = this.navParamsData.fromSend;
    this.fromMultiSend = this.navParamsData.fromMultiSend;
  }

  back() {
    this.viewCtrl.dismiss();
  }

  public async openSearchContactModal(){
    const modal = await this.modalCtrl.create({
      component: SearchContactPage,
      componentProps: {
        wallet: this.wallet,
        recipientId: this.navParamsData.recipientId
      }
    });
    modal.onDidDismiss().then((recipient:any) => {
      if(recipient.data.toAddress){
        this.viewCtrl.dismiss({
          recipientType: recipient.data.recipientType,
          toAddress: recipient.data.toAddress,
          name: recipient.data.name,
          email: recipient.data.email,
          id: recipient.data.id
        });
      }
    });

    return await modal.present();
  }
}
