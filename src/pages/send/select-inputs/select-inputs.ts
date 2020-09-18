import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { ScanPage } from '../../scan/scan';
import { AmountPage } from '../amount/amount';
import { ConfirmPage } from '../confirm/confirm';
import { TransferToModalPage } from '../transfer-to-modal/transfer-to-modal';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AddressProvider } from '../../../providers/address/address';
import { AppProvider } from '../../../providers/app/app';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';
import { Logger } from '../../../providers/logger/logger';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-select-inputs',
  templateUrl: 'select-inputs.html'
})
export class SelectInputsPage {
  public wallet;
  public search: string;
  public parsedData: any;
  public invalidAddress: boolean;
  public bitcore;
  public recipient;
  public inputs: any[] = [];
  public totalAmount: number = 0;

  private selectedInputs = [];
  private validDataTypeMap: string[] = [
    'BitcoinAddress',
    'BitcoinCashAddress',
    'EthereumAddress',
    'EthereumUri',
    'BitcoinUri',
    'BitcoinCashUri'
  ];
  constructor(
    private navCtrl: NavController,
    private currencyProvider: CurrencyProvider,
    private navParams: NavParams,
    private incomingDataProvider: IncomingDataProvider,
    private addressProvider: AddressProvider,
    private appProvider: AppProvider,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private events: Events,
    private modalCtrl: ModalController,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider
  ) {
    this.bitcore = {
      btc: this.bwcProvider.getBitcore(),
      bch: this.bwcProvider.getBitcoreCash()
    };
    this.wallet = this.navParams.data.wallet;
    this.events.subscribe(
      'Local/AddressScanSelectInputs',
      this.updateAddressHandler
    );
    this.events.subscribe('addRecipient', newRecipient => {
      this.addRecipient(newRecipient);
    });
    this.getInputs(this.wallet);
  }

  async ionViewDidLoad() {
    this.logger.info('Loaded: SelectInputsPage');
  }

  ngOnDestroy() {
    this.events.unsubscribe(
      'Local/AddressScanSelectInputs',
      this.updateAddressHandler
    );
    this.events.unsubscribe('addRecipient', newRecipient => {
      this.addRecipient(newRecipient);
    });
  }

  private updateAddressHandler: any = data => {
    this.search = data.value;
    this.processInput();
  };

  private async getInputs(wallet): Promise<any> {
    try {
      this.inputs = await this.walletProvider.getUtxos(wallet);
    } catch (error) {
      this.logger.warn(error);
    }
    const config = this.configProvider.get();
    const spendUnconfirmed = config.wallet.spendUnconfirmed;

    if (spendUnconfirmed) return;
    this.inputs = _.filter(this.inputs, i => {
      return i.confirmations !== 0;
    });
  }

  public getCoinName(coin): string {
    return this.currencyProvider.getCoinName(coin);
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromSelectInputs: true });
  }

  public processInput(): void {
    if (this.search && this.search.trim() != '') {
      this.parsedData = this.incomingDataProvider.parseData(this.search);
      if (this.parsedData && this.parsedData.type == 'PayPro') {
        this.invalidAddress = true;
      } else if (
        this.parsedData &&
        _.indexOf(this.validDataTypeMap, this.parsedData.type) != -1
      ) {
        const isValid = this.checkCoinAndNetwork(this.search);
        if (isValid) {
          this.invalidAddress = false;
          this.newRecipient();
        }
      } else {
        this.invalidAddress = true;
      }
    }
  }

  public newRecipient(): void {
    let newRecipient;
    if (
      this.parsedData &&
      (this.parsedData.type === 'BitcoinUri' ||
        this.parsedData.type === 'BitcoinCashUri' ||
        this.parsedData.type === 'EthereumUri')
    ) {
      let parsed;
      let toAddress;
      let amount;
      let recipientType;
      try {
        if (this.bitcore[this.wallet.coin]) {
          parsed = this.bitcore[this.wallet.coin].URI(this.search);
        }
        const address = this.incomingDataProvider.extractAddress(this.search);
        toAddress =
          parsed && parsed.address
            ? parsed.address.toString()
            : _.clone(address);

        // keep address in original format
        if (
          parsed &&
          parsed.address &&
          this.search.indexOf(toAddress) < 0 &&
          this.wallet.coin == 'bch'
        ) {
          toAddress = parsed.address.toCashAddress();
        }
        const extractedAmount = /[\?\&]amount|value=(\d+([\,\.]\d+)?)/i.exec(
          this.search
        );
        if (parsed && parsed.amount) {
          amount = parsed.amount;
        } else if (extractedAmount) {
          amount = extractedAmount[1];
        }
        recipientType = 'address';
      } catch (_err) {
        // If pasted address isn't a valid uri
        toAddress = _.clone(this.search);
        recipientType = 'address';
      }
      newRecipient = {
        amount,
        toAddress,
        recipientType
      };
    } else {
      newRecipient = {
        toAddress: _.clone(this.search),
        recipientType: 'address'
      };
    }
    this.addRecipient(newRecipient);
  }

  public openAmountModal(item): void {
    let modal = this.modalCtrl.create(
      AmountPage,
      {
        wallet: this.wallet,
        useAsModal: true
      },
      {
        showBackdrop: false,
        enableBackdropDismiss: true,
        cssClass: 'wallet-details-modal'
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      this.cleanSearch();
      if (!data) return;

      let altAmountStr = this.txFormatProvider.formatAlternativeStr(
        this.wallet.coin,
        +data.amount
      );

      item.amount = +data.amount;
      item.altAmountStr = altAmountStr;
      item.fiatAmount = data.fiatAmount;
      item.fiatCode = data.fiatCode;
      item.amountToShow = this.txFormatProvider.formatAmount(
        this.wallet.coin,
        +data.amount
      );
      this.recipient = item;
    });
  }

  public cleanSearch(): void {
    this.search = '';
    this.parsedData = {};
  }

  private checkCoinAndNetwork(data): boolean {
    const addrData = this.addressProvider.getCoinAndNetwork(
      data,
      this.wallet.network
    );
    const isValid =
      this.currencyProvider.getChain(this.wallet.coin).toLowerCase() ==
        addrData.coin && addrData.network == this.wallet.network;

    if (isValid) {
      this.invalidAddress = false;
      return true;
    } else {
      this.invalidAddress = true;
      const network = addrData.network;

      if (this.wallet.coin === 'bch' && this.wallet.network === network) {
        const isLegacy = this.checkIfLegacy();
        isLegacy ? this.showLegacyAddrMessage() : this.showErrorMessage();
      } else {
        this.showErrorMessage();
      }
    }

    return false;
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

  private showLegacyAddrMessage() {
    const appName = this.appProvider.info.nameCase;
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'legacy-address-info',
      { appName }
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        const legacyAddr = this.search;
        const cashAddr = this.addressProvider.translateToCashAddress(
          legacyAddr
        );
        this.search = cashAddr;
        this.processInput();
      }
    });
  }

  private checkIfLegacy(): boolean {
    return (
      this.incomingDataProvider.isValidBitcoinCashLegacyAddress(this.search) ||
      this.incomingDataProvider.isValidBitcoinCashUriWithLegacyAddress(
        this.search
      )
    );
  }

  public addRecipient(recipient): void {
    let amountToShow = +recipient.amount
      ? this.txFormatProvider.formatAmount(this.wallet.coin, +recipient.amount)
      : null;

    let altAmountStr = this.txFormatProvider.formatAlternativeStr(
      this.wallet.coin,
      ++recipient.amount
    );

    this.recipient = {
      amount: +recipient.amount ? +recipient.amount : null,
      amountToShow,
      altAmountStr: altAmountStr ? altAmountStr : null,
      toAddress: recipient.toAddress,
      recipientType: recipient.recipientType,
      name: recipient.name,
      email: recipient.email
    };

    this.cleanSearch();
  }

  public openTransferToModal(): void {
    this.navCtrl.push(TransferToModalPage, {
      wallet: this.wallet,
      fromSelectInputs: true
    });
  }

  public goToConfirm(): void {
    this.navCtrl.push(ConfirmPage, {
      walletId: this.wallet.credentials.walletId,
      fromSelectInputs: true,
      totalInputsAmount:
        this.totalAmount *
        this.currencyProvider.getPrecision(this.wallet.coin).unitToSatoshi,
      toAddress: this.recipient.toAddress,
      amount: this.recipient.amount,
      coin: this.wallet.coin,
      network: this.wallet.network,
      useSendMax: false,
      inputs: _.filter(this.inputs, 'checked')
    });
  }

  public selectInput(input): void {
    if (input.checked) {
      input.checked = false;
      const index = _.indexOf(this.selectedInputs, input);
      this.selectedInputs.splice(index, 1);
    } else {
      input.checked = true;
      this.selectedInputs.push(input);
    }
    this.totalAmount = Number(
      _.sumBy(this.selectedInputs, 'amount').toFixed(8)
    );
  }

  public removeRecipient(): void {
    this.recipient = undefined;
    this.selectedInputs = [];
    this.totalAmount = 0;
    this.inputs.forEach(input => {
      input.checked = false;
    });
    this.cleanSearch();
  }

  public canContinue() {
    return this.recipient
      ? (this.selectedInputs && this.selectedInputs.length <= 0) ||
          (this.recipient.amountToShow &&
            this.recipient.amountToShow > this.totalAmount)
      : true;
  }

  public shortcuts(selectAll: boolean) {
    this.selectedInputs = [];
    this.totalAmount = 0;
    this.inputs.forEach(input => {
      input.checked = selectAll;
      if (selectAll) {
        this.selectedInputs.push(input);
        this.totalAmount = Number(
          _.sumBy(this.selectedInputs, 'amount').toFixed(8)
        );
      }
    });
  }
}
