import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, NavParams, Platform } from '@ionic/angular';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { ProfileProvider } from 'src/app/providers/profile/profile';
import { DecimalFormatBalance } from 'src/providers/decimal-format.ts/decimal-format';

// Providers
import { ClipboardProvider } from '../../../providers/clipboard/clipboard';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';

// Pages
import { RecipientModel } from '../../../components/recipient/recipient.model';
import { WalletProvider } from 'src/app/providers/wallet/wallet';
import { ConfigProvider } from 'src/app/providers/config/config';
import { CurrencyProvider } from 'src/app/providers/currency/currency';
import { ThemeProvider } from 'src/app/providers/theme/theme';

@Component({
  selector: 'page-send-select-inputs',
  templateUrl: 'send-select-inputs.html',
  styleUrls: ['./send-select-inputs.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectInputsSendPage {
  public wallet: any;
  public search: string = '';
  public amount: string = '';
  public isCordova: boolean;
  public invalidAddress: boolean;
  public validDataFromClipboard;
  private onResumeSubscription: Subscription;
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

  titlePage: string;
  navPramss: any;
  listRecipient: RecipientModel[] = [];
  walletId: string;
  subTitle: string;
  isShowDelete: boolean = false;
  public inputs: any[] = [];;
  skipIonChange;
  currentTheme;
  public totalAmount: number = 0;
  private selectedInputs = [];
  public reverse: boolean;
  public isShowSendMax: boolean = false;
  public indeterminateState: boolean = false;
  public checkParentChecked: boolean = false;
  @ViewChild(IonContent) content: IonContent;

  constructor(
    private router: Router,
    private navParams: NavParams,
    private logger: Logger,
    private events: EventManagerService,
    private plt: Platform,
    private clipboardProvider: ClipboardProvider,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider,
    private themeProvider: ThemeProvider
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }

    this.currentTheme = this.themeProvider.currentAppTheme;
    this.listRecipient.push(new RecipientModel({
      toAddress: '',
      address: 0,
      isValid: false
    }))

    this.wallet = this.profileProvider.getWallet(this.navPramss.walletId);
    this.titlePage = `Send  ${(this.wallet.coin as String).toUpperCase()}`;
    this.subTitle = `(from select inputs)`;

    this.isCordova = this.platformProvider.isCordova;
    this.events.subscribe('SendPageRedir', this.SendPageRedirEventHandler);
    this.events.subscribe('Desktop/onFocus', () => {
      this.setDataFromClipboard();
    });

    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.setDataFromClipboard();
    });

    this.getInputs(this.wallet)
  }

  private async getInputs(wallet): Promise<any> {
    try {
      this.inputs = await this.walletProvider.getUtxos(wallet);
    } catch (error) {
      this.logger.warn(error);
    }
    const config = this.configProvider.get();
    const spendUnconfirmed = config.wallet.spendUnconfirmed;

    this.inputs = _.filter(this.inputs, i => {
      return spendUnconfirmed ? !i.immature : !i.immature && i.confirmations !== 0;
    });
  }


  ngOnInit() {
    this.logger.info('Loaded: SelectInputsSendPage');
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

  public getBalance() {
    const lastKnownBalance = this.wallet.lastKnownBalance;
    const totalBalanceStr =
      this.wallet.cachedStatus && this.wallet.cachedStatus.totalBalanceStr;
    return totalBalanceStr || lastKnownBalance;
  }

  public getAlternativeBalance() {
    const totalBalanceAlternative =
      this.wallet.cachedStatus &&
      this.wallet.cachedStatus.totalBalanceAlternative;
    return DecimalFormatBalance(totalBalanceAlternative);
  }

  public goToConfirm(): void {
    const recipient = this.listRecipient[0];
    this.router.navigate(['/confirm'], {
      state: {
        walletId: this.wallet.credentials.walletId,
        fromSelectInputs: true,
        totalInputsAmount:
          this.totalAmount *
          this.currencyProvider.getPrecision(this.wallet.coin).unitToSatoshi,
        toAddress: recipient.toAddress,
        amount: recipient.amount,
        coin: this.wallet.coin,
        network: this.wallet.network,
        useSendMax: false,
        inputs: _.filter(this.inputs, 'checked')
      }
    });
  }

  checkBeforeGoToConfirmPage() {
    const valid = this.listRecipient[0].isValid;
    if (valid) return (this.totalAmount >= _.toNumber(this.listRecipient[0].amountToShow))
    return false;
  }

  public reverseInputs() {
    this.reverse = !this.reverse;
    this.inputs.reverse();
  }

  public selectInputTotal(event): void {
    if (this.skipIonChange) {
      return;
    } else {
      this.skipIonChange = true;
    }
    if (!event.detail.checked) {
      this._clearCheckBok(this.inputs);
      this.totalAmount = 0;
      this.checkParentChecked = false;
    } else {
      this._setAllCheckBok(this.inputs);
      this.totalAmount = Number(
        _.sumBy(this.inputs, 'amount').toFixed(8)
      );
      this.checkParentChecked = true;
    }
  }

  private _clearCheckBok(inputs) {
    _.forEach(inputs, item => {
      item.checked = false;
    })
    this.selectedInputs = [];
  }

  private _setAllCheckBok(inputs) {
    _.forEach(inputs, item => {
      item.checked = true;
      this.selectedInputs.push(item);
    })
  }


  public selectInput(input, event): void {
    if (this.skipIonChange) {
      return;
    }
    else {
      this.skipIonChange = true;
    }
    if (!event.detail.checked) {
      const index = _.indexOf(this.selectedInputs, input);
      this.selectedInputs.splice(index, 1);
      input.checked = false;
    } else {
      this.selectedInputs.push(input);
      input.checked = true;
    }
    this.totalAmount = Number(
      _.sumBy(this.selectedInputs, 'amount').toFixed(8)
    );
    const selected = _.size(this.selectedInputs);
    const allItems = _.size(this.inputs);
    if (selected > 0 && selected < allItems) {
      // One item is selected among all checkbox elements
      this.indeterminateState = true;
      this.checkParentChecked = false;
    } else if (selected == allItems) {
      // All item selected
      this.checkParentChecked = true;
      this.indeterminateState = false;
    } else {
      // No item is selected
      this.indeterminateState = false;
      this.checkParentChecked = false;
    }
  }

  public shortcuts(selectAll: boolean) {
    this.skipIonChange = true;
    this.selectedInputs = [];
    this.totalAmount = 0;
    this.inputs.forEach(input => {
      input.checked = selectAll;
      if (selectAll) {
        this.selectedInputs.push(input);
      }
    });
    this.totalAmount = Number(
      _.sumBy(this.selectedInputs, 'amount').toFixed(8)
    );
  }
}
