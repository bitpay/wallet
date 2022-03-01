import { Component, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NavParams, Platform } from '@ionic/angular';
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
import { RecipientComponent } from '../../components/recipient/recipient.component';
import { RecipientModel } from '../../components/recipient/recipient.model';

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
  private validDataTypeMap: string[] = [
    'BitcoinAddress',
    'BitcoinCashAddress',
    'ECashAddress',
    'LotusAddress',
    'EthereumAddress',
    'EthereumUri',
    'RippleAddress',
    'DogecoinAddress',
    'LitecoinAddress',
    'RippleUri',
    'BitcoinUri',
    'BitcoinCashUri',
    'DogecoinUri',
    'LitecoinUri',
    'BitPayUri',
    'ECashUri',
    'LotusUri'
  ];
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

  isDonation: boolean;
  titlePage: string ;
  dataDonation: any;
  navPramss: any;
  listRecipient: RecipientModel[] = [];
  walletId: string;
  isShowSendMax: boolean = true;
  isShowDelete: boolean = false;
  @ViewChildren(RecipientComponent) listFinalRecipient: QueryList<RecipientComponent>;
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
    this.listRecipient.push(new RecipientModel({
      toAddress: '',
      address: 0,
      isValid: false
    }))
    this.walletId = this.navPramss.walletId;
    this.wallet = this.profileProvider.getWallet(this.navPramss.walletId);
    this.titlePage = "Send " + (this.wallet.coin as String).toUpperCase();
    this.isDonation = this.navPramss.isDonation;
    if (this.isDonation) {
      this.titlePage = "Receiving Wallet";
      this.dataDonation = this.navPramss;
      this.wallet.donationCoin = this.navPramss.donationCoin;
    } else {
      this.wallet.donationCoin = undefined;
    }
    this.isCordova = this.platformProvider.isCordova;
    this.events.subscribe('SendPageRedir', this.SendPageRedirEventHandler);
    this.events.subscribe('Desktop/onFocus', () => {
      this.setDataFromClipboard();
    });
    this.events.subscribe('addRecipient', newRecipient => {
      this.addRecipient(newRecipient);
    });
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.setDataFromClipboard();
    });
  }

  ngOnInit() {
    this.logger.info('Loaded: SendPage');
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
    // toto ionic 4 : Remove view ???? Handle in ionic 4 - 5 ???
    // const currentIndex = this.navCtrl.getActive().index;
    // const currentView = this.navCtrl.getViews();
    nextView.params.fromWalletDetails = true;
    nextView.params.walletId = this.wallet.credentials.walletId;
    // this.navCtrl
    //   .push(this.pageMap[nextView.name], nextView.params, { animate: false })
    //   .then(() => {
    //     if (currentView[currentIndex].name == 'ScanPage')
    //       this.navCtrl.remove(currentIndex);
    //   });
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

  public showMoreOptions(): void {
    const optionsSheet = this.actionSheetProvider.createOptionsSheet(
      'send-options',
      {
        isUtxoCoin: this.currencyProvider.isUtxoCoin(this.wallet.coin),
        isMultiSend: this.currencyProvider.isMultiSend(this.wallet.coin)
      }
    );
    optionsSheet.present();

    optionsSheet.onDidDismiss(option => {
      if (option == 'multi-send')
        this.router
          .navigate(['/multi-send'], { // MultiSendPage
            state: { walletId: this.wallet.id }
          })
          .then(() => {
            this.analyticsProvider.logEvent('multi_send_clicked', {
              coin: this.wallet.coin
            });
          });
      if (option == 'select-inputs')
        this.router
          .navigate(['/select-inputs'], { // SelectInputsPage
            state: { walletId: this.wallet.id }
          })
          .then(() => {
            this.analyticsProvider.logEvent('select_inputs_clicked', {
              coin: this.wallet.coin
            });
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
  }

  public continue() {
    const listFinal = this.listFinalRecipient.map(s => s.recipient);
    console.log(listFinal);
    this.goToConfirm();
  }

  public deleteRecipient(id) {
    this.listRecipient = this.listRecipient.filter(s => s.id !== id);
    this.isShowSendMax = this.listRecipient.length === 1;
    this.isShowDelete = this.listRecipient.length > 1;
  }

  public goToConfirm(): void {
    let totalAmount = 0;
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
          useSendMax: true,
          recipients: this.listRecipient
        }
      });
    }
  }

  sendMax() {
    const recipient = this.listRecipient[0];
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
  }

  public addRecipient(recipient): void {
    let recipientSelected = this.listRecipient.find(s => s.id === recipient.id);
    if (recipientSelected) {
      recipientSelected.toAddress = recipient.toAddress;
      recipientSelected.name = recipient.name;
      recipientSelected.recipientType = recipient.recipientType;
    }
  }
  checkBeforeGoToConfirmPage(){
    return this.listRecipient.findIndex(s => s.isValid === false) !== -1;
  }
}
