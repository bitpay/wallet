import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { CurrencyProvider } from '../../../providers';
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AddressProvider } from '../../../providers/address/address';
import { AppProvider } from '../../../providers/app/app';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';
import { Logger } from '../../../providers/logger/logger';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

// Pages
import { ScanPage } from '../../scan/scan';
import { AmountPage } from '../amount/amount';
import { ConfirmPage } from '../confirm/confirm';
import { TransferToModalPage } from '../transfer-to-modal/transfer-to-modal';
@Component({
  selector: 'page-multi-send',
  templateUrl: 'multi-send.html'
})
export class MultiSendPage {
  public wallet: any;
  public bitcore;
  public parsedData: any;
  public search: string = '';
  public multiRecipients: any = [];
  public contactsList = [];
  public filteredContactsList = [];
  public filteredWallets = [];
  public hasContacts: boolean;
  public contactsShowMore: boolean;
  public amount: string;
  public fiatAmount: number;
  public fiatCode: string;
  public invalidAddress: boolean;
  public isDisabledContinue: boolean;

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
    private navParams: NavParams,
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private incomingDataProvider: IncomingDataProvider,
    private addressProvider: AddressProvider,
    private events: Events,
    private actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private txFormatProvider: TxFormatProvider,
    private bwcProvider: BwcProvider,
    private errorsProvider: ErrorsProvider
  ) {
    this.bitcore = {
      btc: this.bwcProvider.getBitcore(),
      bch: this.bwcProvider.getBitcoreCash()
    };
    this.isDisabledContinue = true;
    this.wallet = this.navParams.data.wallet;
    this.events.subscribe(
      'Local/AddressScanMultiSend',
      this.updateAddressHandler
    );
    this.events.subscribe('addRecipient', newRecipient => {
      this.addRecipient(newRecipient);
      this.checkGoToConfirmButton();
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: MultiSendPage');
  }

  ngOnDestroy() {
    this.events.unsubscribe(
      'Local/AddressScanMultiSend',
      this.updateAddressHandler
    );
    this.events.unsubscribe('addRecipient');
  }

  private updateAddressHandler: any = data => {
    this.search = data.value;
    this.processInput();
  };

  public openTransferToModal(): void {
    this.navCtrl.push(TransferToModalPage, {
      wallet: this.wallet,
      fromMultiSend: true
    });
  }

  public openAmountModal(item, index): void {
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
      this.multiRecipients[index] = item;
      this.checkGoToConfirmButton();
    });
  }

  public addRecipient(recipient): void {
    let amountToShow = +recipient.amount
      ? this.txFormatProvider.formatAmount(this.wallet.coin, +recipient.amount)
      : null;

    let altAmountStr = this.txFormatProvider.formatAlternativeStr(
      this.wallet.coin,
      ++recipient.amount
    );

    this.multiRecipients.push({
      amount: +recipient.amount ? +recipient.amount : null,
      amountToShow,
      altAmountStr: altAmountStr ? altAmountStr : null,
      toAddress: recipient.toAddress,
      recipientType: recipient.recipientType,
      recipient
    });

    this.checkGoToConfirmButton();
    this.cleanSearch();
  }

  public newRecipient(): void {
    if (
      this.parsedData &&
      (this.parsedData.type === 'BitcoinUri' ||
        this.parsedData.type === 'BitcoinCashUri' ||
        this.parsedData.type === 'EthereumUri')
    ) {
      let parsed;
      let toAddress;
      let amount;
      let recipient;
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
        recipient = null;
      } catch (_err) {
        // If pasted address isn't a valid uri
        toAddress = _.clone(this.search);
        recipientType = 'address';
      }
      const newRecipient = {
        amount,
        toAddress,
        recipientType,
        recipient
      };
      const index = this.multiRecipients.length;
      if (!amount) {
        this.openAmountModal(newRecipient, index);
      } else {
        this.addRecipient(newRecipient);
      }
    } else {
      const newRecipient = {
        toAddress: _.clone(this.search),
        recipientType: 'address'
      };
      const index = this.multiRecipients.length;
      this.openAmountModal(newRecipient, index);
    }
  }

  private checkGoToConfirmButton(): void {
    let b = false;
    this.multiRecipients.forEach(recipient => {
      if (!recipient.amountToShow) {
        b = true;
      }
    });
    this.isDisabledContinue = b;
  }

  public cleanSearch(): void {
    this.search = '';
    this.parsedData = {};
  }

  public removeRecipient(index): void {
    this.multiRecipients.splice(index, 1);
    this.checkGoToConfirmButton();
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromMultiSend: true });
  }

  public getCoinName(coin): string {
    return this.currencyProvider.getCoinName(coin);
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

  private checkIfLegacy(): boolean {
    return (
      this.incomingDataProvider.isValidBitcoinCashLegacyAddress(this.search) ||
      this.incomingDataProvider.isValidBitcoinCashUriWithLegacyAddress(
        this.search
      )
    );
  }

  public goToConfirm(): void {
    let totalAmount = 0;
    this.multiRecipients.forEach(recipient => {
      totalAmount += recipient.amount;
    });
    this.navCtrl.push(ConfirmPage, {
      walletId: this.wallet.credentials.walletId,
      fromMultiSend: true,
      totalAmount,
      recipientType: 'multi',
      color: this.wallet.color,
      coin: this.wallet.coin,
      network: this.wallet.network,
      useSendMax: false,
      recipients: this.multiRecipients
    });
  }
}
