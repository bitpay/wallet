import { Component, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, NavParams, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { ProfileProvider } from 'src/app/providers/profile/profile';
import { TxFormatProvider } from 'src/app/providers/tx-format/tx-format';
import { DecimalFormatBalance } from 'src/providers/decimal-format.ts/decimal-format';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AddressProvider } from '../../providers/address/address';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { AppProvider } from '../../providers/app/app';
import { ClipboardProvider } from '../../providers/clipboard/clipboard';
import { Coin, CurrencyProvider } from '../../providers/currency/currency';
import { ErrorsProvider } from '../../providers/errors/errors';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../../providers/platform/platform';

// Pages
import { RecipientModel } from '../../components/recipient/recipient.model';
import { RecipientComponent } from 'src/app/components/recipient/recipient.component';

@Component({
  selector: 'page-send',
  templateUrl: 'send.html',
  styleUrls: ['./send.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SendPage {
  public wallet: any;
  public search: string = '';
  public amount: string = '';
  public isCordova: boolean;
  public invalidAddress: boolean;
  public validDataFromClipboard;
  private onResumeSubscription: Subscription;
  public isScroll = false;
  private pageMap = {
    AddressbookAddPage: '/address-book-add',
    AmountPage: '/amount',
    ConfirmPage: '/confirm',
    CopayersPage: '/copayers',
    ImportWalletPage: '/import-wallet',
    JoinWalletPage: '/join-wallet',
    PaperWalletPage: '/paper-wallet',
    WalletDetailsPage: '/wallet-details'
  };
  public currentTheme;
  isDonation: boolean;
  titlePage: string;
  dataDonation: any;
  navPramss: any;
  token;
  listRecipient: RecipientModel[] = [];
  walletId: string;
  isShowSendMax: boolean = true;
  isShowDelete: boolean = false;
  toAddress: string = '';
  formatRemaining: string;
  recipientNotInit: RecipientModel;
  @ViewChild(IonContent) content: IonContent;
  @ViewChildren(RecipientComponent) queryListRecipientComponent: QueryList<RecipientComponent>;
  constructor(
    private currencyProvider: CurrencyProvider,
    private router: Router,
    private navParams: NavParams,
    private logger: Logger,
    private incomingDataProvider: IncomingDataProvider,
    private addressProvider: AddressProvider,
    private events: EventManagerService,
    private actionSheetProvider: ActionSheetProvider,
    private analyticsProvider: AnalyticsProvider,
    private appProvider: AppProvider,
    private translate: TranslateService,
    private errorsProvider: ErrorsProvider,
    private plt: Platform,
    private clipboardProvider: ClipboardProvider,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    this.toAddress = this.navPramss.toAddress;
    this.listRecipient.push(new RecipientModel({
      toAddress: !_.isEmpty(this.toAddress) ? this.toAddress : '',
      address: 0,
      isValid: false
    }))
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    this.wallet = this.profileProvider.getWallet(this.navPramss.walletId);
    this.token = this.navPramss.token;
    this.titlePage = "Send " + (this.wallet.coin as String).toUpperCase();
    if (this.token) this.titlePage = `Send ${this.token.tokenInfo.name}`
    this.isDonation = this.navPramss.isDonation;
    if (this.isDonation) {
      this.titlePage = "Send Donation";
      this.dataDonation = this.navPramss;
      this.wallet.donationCoin = this.navPramss.donationCoin;
      const coinDonation = _.get(this.dataDonation, 'donationCoin', 'xpi');
      const precision = this.currencyProvider.getPrecision(coinDonation as Coin).unitToSatoshi;
      const remaining = this.dataDonation.remaining;
      this.formatRemaining = `${this.txFormatProvider.formatAmount(coinDonation, precision * remaining)} ${_.upperCase(coinDonation)}`;
    } else {
      this.wallet.donationCoin = undefined;
    }
    this.isCordova = this.platformProvider.isCordova;
    this.events.subscribe('SendPageRedir', this.SendPageRedirEventHandler);
    this.events.subscribe('Desktop/onFocus', () => {
      this.setDataFromClipboard();
    });
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.setDataFromClipboard();
    });
  }

  async handleScrolling(event) {
    if (event.detail.currentY > 0) {
      this.isScroll = true;
    }
    else {
      this.isScroll = false;
    }
  }

  ngOnInit() {
    this.logger.info('Loaded: SendPage');
  }

  ngAfterViewInit() {
    if (this.recipientNotInit) {
      this.queryListRecipientComponent.toArray()[0].updateRecipient(this.recipientNotInit);
      this.recipientNotInit = null;
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe('SendPageRedir', this.SendPageRedirEventHandler);
    this.events.unsubscribe('Desktop/onFocus');
    this.onResumeSubscription.unsubscribe();
  }

  private async setDataFromClipboard() {
    this.validDataFromClipboard = await this.clipboardProvider.getValidData(
      this.wallet.coin
    );
    console.log(this.validDataFromClipboard);
  }

  private SendPageRedirEventHandler: any = nextView => {
    nextView.params.fromWalletDetails = true;
    nextView.params.walletId = this.wallet.credentials.walletId;
    if (nextView && nextView.params.amount) {
      if (nextView.params.recipientId) {
        let totalAmountStr = this.txFormatProvider.satToUnit(
          nextView.params.amount,
          this.wallet.coin
        );
        this.queryListRecipientComponent.toArray().find(s => s.recipient.id === nextView.params.recipientId).updateRecipient(new RecipientModel({
          toAddress: nextView.params.toAddress,
          amount: totalAmountStr,
          isSpecificAmount: true
        }))
      }
      else {
        let totalAmountStr = this.txFormatProvider.satToUnit(
          nextView.params.amount,
          this.wallet.coin
        );
        if (this.queryListRecipientComponent) {
          this.queryListRecipientComponent.toArray()[0].updateRecipient(new RecipientModel({
            toAddress: nextView.params.toAddress,
            amount: totalAmountStr,
            isSpecificAmount: true
          }));
        }
        else {
          this.recipientNotInit = new RecipientModel({
            toAddress: nextView.params.toAddress,
            amount: totalAmountStr,
            isSpecificAmount: true
          })
        }
      }
    }
    this.router.navigate([this.pageMap[nextView.name]], {
      state: nextView.params
    });
  };

  public shouldShowZeroState() {
    return (
      this.wallet &&
      this.wallet.cachedStatus &&
      !this.wallet.cachedStatus.totalBalanceSat
    );
  }



  public showOptions(coin: Coin) {
    return (
      (this.currencyProvider.isMultiSend(coin) ||
        this.currencyProvider.isUtxoCoin(coin)) &&
      !this.shouldShowZeroState()
    );
  }

  private showErrorMessage() {
    const msg = this.translate.instant(
      'The wallet you are using does not match the network and/or the currency of the address provided'
    );
    const title = this.translate.instant('Error');
    this.errorsProvider.showDefaultError(msg, title, () => {
      this.search = '';
    });
  }

  public getBalance() {
    const lastKnownBalance = this.wallet.lastKnownBalance;
    if (this.token) {
      return `${this.token.amountToken} ${this.token.tokenInfo.symbol}`
    }
    if (this.wallet.coin === 'xrp') {
      const availableBalanceStr =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.availableBalanceStr;
      return availableBalanceStr || lastKnownBalance;
    } else {
      const totalBalanceStr =
        this.wallet.cachedStatus && this.wallet.cachedStatus.totalBalanceStr;
      return totalBalanceStr || lastKnownBalance;
    }
  }

  public getAlternativeBalance() {
    if (this.wallet.coin === 'xrp') {
      const availableAlternative =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.availableBalanceAlternative;
      return DecimalFormatBalance(availableAlternative);
    } else {
      const totalBalanceAlternative =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.totalBalanceAlternative;
      return DecimalFormatBalance(totalBalanceAlternative);
    }
  }

  public cleanSearch() {
    this.search = '';
    this.invalidAddress = false;
  }

  public goToSelectInput(): void {
    this.router
      .navigate(['/send-select-inputs'], { // SelectInputsPage
        state: { walletId: this.wallet.id }
      })
      .then(() => {
        this.analyticsProvider.logEvent('select_inputs_clicked', {
          coin: this.wallet.coin
        });
      });
  }

  public addNewRecipient() {
    this.listRecipient.push(new RecipientModel({
      to: '',
      amount: 0
    }))
    this.isShowSendMax = this.listRecipient.length === 1;
    this.isShowDelete = this.listRecipient.length > 1;
    this.content.scrollToBottom(1000);
  }

  public deleteRecipient(id) {
    this.listRecipient = this.listRecipient.filter(s => s.id !== id);
    this.isShowSendMax = this.listRecipient.length === 1;
    this.isShowDelete = this.listRecipient.length > 1;
  }

  private goToConfirmToken() {
    const recipient = this.listRecipient[0];
    this.router.navigate(['/confirm-token'], {
      state: {
        amount: recipient.amount,
        toAddress: recipient.toAddress,
        token: this.token,
        walletId: this.wallet.credentials.walletId
      }
    });
  }

  private goToConfirmDonation() {
    const recipient = this.listRecipient[0];
    this.router.navigate(['/confirm'], {
      state: {
        amount: recipient.amount,
        coin: this.wallet.coin,
        currency: recipient.currency,
        fromWalletDetails: true,
        useSendMax: false,
        network: this.wallet.network,
        recipientType: recipient.recipientType,
        walletId: this.wallet.credentials.walletId,
        toAddress: this.dataDonation.toAddress,
        isDonation: true,
        remaining: this.dataDonation.remaining,
        donationCoin: this.dataDonation.donationCoin,
        receiveLotusAddress: recipient.toAddress,
        nameReceiveLotusAddress: recipient.name
      }
    });
  }

  public goToConfirm(): void {
    let totalAmount = 0;
    if (this.token) return this.goToConfirmToken();
    if (this.isDonation) return this.goToConfirmDonation();
    if (this.listRecipient.length === 1) {
      const recipient = this.listRecipient[0];
      this.router.navigate(['/confirm'], {
        state: {
          walletId: this.wallet.credentials.walletId,
          recipientType: recipient.recipientType,
          amount: recipient.amount,
          currency: recipient.currency,
          coin: this.wallet.coin,
          network: this.wallet.network,
          useSendMax: false,
          toAddress: recipient.toAddress,
          name: recipient.name,
          fromWalletDetails: true
        }
      });
    } else {
      this.listRecipient.forEach(recipient => {
        totalAmount += recipient.amount;
      });
      this.router.navigate(['/confirm'], {
        state: {
          walletId: this.wallet.credentials.walletId,
          fromMultiSend: true,
          totalAmount,
          recipientType: 'multi',
          color: this.wallet.color,
          coin: this.wallet.coin,
          network: this.wallet.network,
          useSendMax: false,
          recipients: this.listRecipient
        }
      });
    }
  }

  sendMax(isToken:boolean) {
    const recipient = this.listRecipient[0];
    if(!isToken){
      this.router.navigate(['/confirm'], {
        state: {
          walletId: this.wallet.credentials.walletId,
          recipientType: recipient.recipientType,
          amount: recipient.amount,
          currency: recipient.currency,
          coin: this.wallet.coin,
          network: this.wallet.network,
          useSendMax: true,
          toAddress: recipient.toAddress,
          name: recipient.name
        }
      });
    } else{
      this.goToConfirmToken();
    }
   
  }

  checkBeforeGoToConfirmPage() {
    return this.listRecipient.findIndex(s => s.isValid === false) !== -1;
  }
}
