import { Component, ViewEncapsulation } from '@angular/core';
import { Logger } from '../../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing/ngx';

// services
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ConfigProvider } from '../../../providers/config/config';
import { Coin, CurrencyProvider } from '../../../providers/currency/currency';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { NavParams } from '@ionic/angular';
import { Router } from '@angular/router';
import _ from 'lodash';
import { NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';

@Component({
  selector: 'page-custom-amount',
  templateUrl: 'custom-amount.html',
  styleUrls: ['./custom-amount.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CustomAmountPage {
  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallet;
  public showShareButton: boolean;
  public amountUnitStr: string;
  public amountCoin: string;
  public altAmountStr: string;
  navParamsData;
  typeErrorQr =  NgxQrcodeErrorCorrectionLevels;
  constructor(
    public currencyProvider: CurrencyProvider,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private socialSharing: SocialSharing,
    private txFormatProvider: TxFormatProvider,
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private router: Router,
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    // if (_.isEmpty(this.navParamsData && this.navParams && !_.isEmpty(this.navParams.data))) this.navParamsData = this.navParams.data;
    const walletId = this.navParamsData.id;
    this.showShareButton = this.platformProvider.isCordova;

    this.wallet = this.profileProvider.getWallet(walletId);

    this.walletProvider.getAddress(this.wallet, false).then(addr => {
      this.address = this.walletProvider.getAddressView(
        this.wallet.coin,
        this.wallet.network,
        addr
      );

      const parsedAmount = this.txFormatProvider.parseAmount(
        this.wallet.coin,
        this.navParamsData.amount,
        this.navParamsData.currency
      );

      // Amount in USD or BTC
      const _amount = parsedAmount.amount;
      const _currency = parsedAmount.currency;
      this.amountUnitStr = parsedAmount.amountUnitStr;

      if (!Coin[_currency]) {
        // Convert to BTC or BCH
        const amountUnit = this.txFormatProvider.satToUnit(
          parsedAmount.amountSat,
          this.wallet.coin
        );
        var btcParsedAmount = this.txFormatProvider.parseAmount(
          this.wallet.coin,
          amountUnit,
          this.wallet.coin.toUpperCase()
        );

        this.amountCoin = btcParsedAmount.amount;
        this.altAmountStr = btcParsedAmount.amountUnitStr;
      } else {
        this.amountCoin = _amount; // BTC or BCH
        this.altAmountStr = this.txFormatProvider.formatAlternativeStr(
          this.wallet.coin,
          parsedAmount.amountSat
        );
      }

      let protoAddr;
      if (this.wallet.coin != 'bch') {
        protoAddr = this.walletProvider.getProtoAddress(
          this.wallet.coin,
          this.wallet.network,
          this.address
        );
      }

      if (
        this.currencyProvider.isUtxoCoin(this.wallet.coin) ||
        this.wallet.coin === 'xrp'
      ) {
        this.qrAddress =
          (protoAddr ? protoAddr : this.address) + '?amount=' + this.amountCoin;
      } else {
        this.qrAddress =
          (protoAddr ? protoAddr : this.address) +
          '?value=' +
          parsedAmount.amountSat;
      }
    });
  }

  ngOnInit(){
    this.logger.info('Loaded: CustomAmountPage');
  }

  public shareAddress(): void {
    this.socialSharing.share(this.qrAddress);
  }

  public showPaymentRequestInfo(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'payment-request',
      {
        amount: this.amountUnitStr,
        name: this.wallet.name
      }
    );
    infoSheet.present();
  }
}
