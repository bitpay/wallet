import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AmountPage } from '../send/amount/amount';
import { ProfileProvider } from '../../providers/profile/profile';
import { ActionSheetController } from 'ionic-angular';

@Component({
  selector: 'page-receive',
  templateUrl: 'receive.html',
})
export class ReceivePage {

  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallets: any;
  public selectedWallet: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private profile: ProfileProvider,
    public actionSheetCtrl: ActionSheetController
  ) {
    this.wallets = this.profile.bind();
    this.selectedWallet = this.wallets[0].credentials;

    this.protocolHandler = "bitcoin";
    this.address = "1FgGP9dKqtWC1Q9xGhPYVmAeyezeZCFjhf";
    this.updateQrAddress();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReceivePage');
  }

  requestSpecificAmount() {
    this.navCtrl.push(AmountPage, {address: this.address, sending: false});
  }

  setAddress() {
    this.address = this.address === "1FgGP9dKqtWC1Q9xGhPYVmAeyezeZCFjhf" ? "1RTes3reeRTs1Q9xGhPYVmQFrdUyCr3EsX" : "1FgGP9dKqtWC1Q9xGhPYVmAeyezeZCFjhf";
    this.updateQrAddress();
  }

  updateQrAddress () {
    this.qrAddress = this.protocolHandler + ":" + this.address;
  }

  showWallets() {
    let buttonsTest: Array<any> = [];
    let coinClass: string = "";

    this.wallets.forEach((wallet, index) => {
      if (wallet.credentials.coin === "btc") {
        coinClass = "wallets-btc-icon";
        if (wallet.credentials.network === "testnet") {
          coinClass = "wallets-testnet-icon";
        }
      } else {
        coinClass = "wallets-bch-icon";
      }

      let walletButton: Object = {
        text: wallet.credentials.walletName,
        cssClass: coinClass,
        handler: () => {
           this.updateSelectedWallet(wallet);
         }
      }
      buttonsTest.push(walletButton);
    });

    const actionSheet = this.actionSheetCtrl.create({
     title: 'Select a wallet',
     buttons: buttonsTest
   });

   actionSheet.present();
  }

  updateSelectedWallet(wallet: any) {
    this.selectedWallet = wallet.credentials;
    this.setAddress();
  }

}
