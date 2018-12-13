import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

// providers
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-payrpo',
  templateUrl: 'paypro.html'
})
export class PayProPage {
  public tx;
  public address: string;

  constructor(
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private walletProvider: WalletProvider
  ) {
    this.tx = this.navParams.data.tx;
    const wallet = this.navParams.data.wallet;
    const address = this.walletProvider.getAddressView(
      wallet.coin,
      this.tx.paypro.toAddress
    );
    const protoAddress = this.walletProvider.getProtoAddress(
      wallet.coin,
      wallet.network,
      address
    );
    this.address =
      wallet.coin == 'bch' && !this.walletProvider.useLegacyAddress()
        ? protoAddress.toLowerCase()
        : address;
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
