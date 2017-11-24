import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController, Events, ModalController, ViewController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ExternalLinkProvider } from '../../providers/external-link/external-link';

//pages
import { AmountPage } from '../send/amount/amount';
import { SendPage } from '../send/send';
import { AddressbookAddPage } from '../settings/addressbook/add/add';
import { AddressbookPage } from '../settings/addressbook/addressbook';
import { PaperWalletPage } from '../paper-wallet/paper-wallet';
import { ScanPage } from '../scan/scan';

@Component({
  selector: 'page-incoming-data-menu',
  templateUrl: 'incoming-data-menu.html',
})
export class IncomingDataMenuPage {

  public data: string;
  public type: string;
  public https: boolean = false;

  constructor(
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private actionSheet: ActionSheetController,
    private log: Logger,
    private fb: FormBuilder,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider
  ) {
  }

  ionViewDidLoad() {
    this.data = this.navParams.get('data').data;
    this.type = this.navParams.get('data').type;
    if (this.type === 'url') {
      if (this.data.indexOf('https://') === 0) {
        this.https = true;
      }
    }
  }

  public close(redirTo: string, value: string) {
    this.viewCtrl.dismiss({ redirTo: redirTo, value: value });
  }
}