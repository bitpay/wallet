import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

//providers
import { ProfileProvider } from '../../../providers/profile/profile';
import { PlatformProvider } from '../../../providers/platform/platform';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

@Component({
  selector: 'page-custom-amount',
  templateUrl: 'custom-amount.html',
})
export class CustomAmountPage {

  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallet: any;
  public showShareButton: boolean;
  public amountUnitStr: string;
  public amountCoin: string;
  public altAmountStr: string;

  constructor(
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private socialSharing: SocialSharing,
    private txFormatProvider: TxFormatProvider
  ) {
    let walletId = this.navParams.data.id;
    this.showShareButton = this.platformProvider.isCordova;

    this.wallet = this.profileProvider.getWallet(walletId);

    this.walletProvider.getAddress(this.wallet, false).then((addr) => {
      this.address = this.walletProvider.getAddressView(this.wallet, addr);

      let parsedAmount = this.txFormatProvider.parseAmount(
        this.wallet.coin,
        this.navParams.data.amount,
        this.navParams.data.currency
      );

      // Amount in USD or BTC
      let _amount = parsedAmount.amount;
      let _currency = parsedAmount.currency;
      this.amountUnitStr = parsedAmount.amountUnitStr;

      if (_currency != 'BTC' && _currency != 'BCH') {
        // Convert to BTC or BCH
        let amountUnit = this.txFormatProvider.satToUnit(parsedAmount.amountSat);
        var btcParsedAmount = this.txFormatProvider.parseAmount(this.wallet.coin, amountUnit, this.wallet.coin.toUpperCase());

        this.amountCoin = btcParsedAmount.amount;
        this.altAmountStr = btcParsedAmount.amountUnitStr;
      } else {
        this.amountCoin = _amount; // BTC or BCH
        this.altAmountStr = this.txFormatProvider.formatAlternativeStr(this.wallet.coin, parsedAmount.amountSat);
      }

      this.updateQrAddress();
    });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad CustomAmountPage');
  }

  private updateQrAddress(): void {
    this.qrAddress = this.walletProvider.getProtoAddress(this.wallet, this.address) + "?amount=" + this.amountCoin;
  }

  public shareAddress(): void {
    this.socialSharing.share(this.qrAddress);
  }

}
