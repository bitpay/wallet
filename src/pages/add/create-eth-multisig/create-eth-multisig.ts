import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { AddressProvider } from '../../../providers/address/address';
import { GnosisFactories } from '../../../providers/currency/gnosisFactories';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';
import { Logger } from '../../../providers/logger/logger';
import { WalletProvider } from '../../../providers/wallet/wallet';

// Pages
import { ScanPage } from '../../scan/scan';

@Component({
  selector: 'page-create-eth-multisig',
  templateUrl: 'create-eth-multisig.html'
})
export class CreateEthMultisigPage {
  public pairedWallet: any;
  public multisigAddresses: string[] = [];
  public invalidAddress: boolean;
  public search: string = '';
  public m: number; // requiredConfirmations
  public n: number; // totalCopayers

  constructor(
    private addressProvider: AddressProvider,
    private errorsProvider: ErrorsProvider,
    private events: Events,
    private incomingDataProvider: IncomingDataProvider,
    private logger: Logger,
    private navParams: NavParams,
    private translate: TranslateService,
    private walletProvider: WalletProvider,
    private navCtrl: NavController
  ) {
    this.pairedWallet = this.navParams.data.pairedWallet;
    this.n = this.navParams.data.n;
    this.m = this.navParams.data.m;

    this.events.subscribe(
      'Local/AddressScanEthMultisig',
      this.updateAddressHandler
    );

    this.walletProvider.getAddress(this.pairedWallet, false).then(address => {
      this.multisigAddresses = [address];
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CreateEthMultisigPage');
  }

  ngOnDestroy() {
    this.events.unsubscribe(
      'Local/AddressScanEthMultisig',
      this.updateAddressHandler
    );
  }

  private updateAddressHandler: any = data => {
    this.search = data.value;
    this.processInput();
  };

  public processInput(): void {
    const validDataTypeMap = ['EthereumAddress'];
    if (this.search && this.search.trim() != '') {
      const parsedData = this.incomingDataProvider.parseData(this.search);
      if (parsedData && _.indexOf(validDataTypeMap, parsedData.type) != -1) {
        const isValid = this.checkCoinAndNetwork(this.search);
        if (isValid) {
          setTimeout(() => {
            this.invalidAddress = false;
            this.addAddress(this.search);
          }, 100);
        } else {
          this.invalidAddress = true;
          const msg = this.translate.instant(
            'The wallet you are using does not match the network and/or the currency of the address provided'
          );
          this.showErrorMessage(msg);
        }
      } else {
        this.invalidAddress = true;
      }
    }
  }

  public cleanSearch(): void {
    this.search = '';
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromEthMultisig: true });
  }

  private checkCoinAndNetwork(address: string): boolean {
    const addrData = this.addressProvider.getCoinAndNetwork(
      address,
      this.pairedWallet.network
    );
    const isValid = Boolean(
      addrData &&
        this.pairedWallet.coin == addrData.coin &&
        this.pairedWallet.network == addrData.network
    );
    return isValid;
  }

  private showErrorMessage(msg: string) {
    const title = this.translate.instant('Error');
    this.errorsProvider.showDefaultError(msg, title, () => {
      this.cleanSearch();
    });
  }

  public addAddress(address: string) {
    if (!address) return;
    if (this.n == this.multisigAddresses.length) {
      const msg = this.translate.instant(
        'The maximum number of Copayers has already been reached'
      );
      this.showErrorMessage(msg);
      this.cleanSearch();
      return;
    }
    if (_.includes(this.multisigAddresses, address)) {
      const msg = this.translate.instant('Address already added');
      this.showErrorMessage(msg);
      this.cleanSearch();
      return;
    }
    this.multisigAddresses.push(address);
    this.cleanSearch();
  }

  public removeAddress(index: number): void {
    this.multisigAddresses.splice(index, 1);
  }

  public goToConfirm(): void {
    const amount = 0;
    const network = this.navParams.data.testnetEnabled ? 'testnet' : 'livenet';
    let nextView = {
      name: 'ConfirmPage',
      params: {
        walletName: this.navParams.data.walletName,
        walletId: this.pairedWallet.credentials.walletId, // linked eth wallet
        amount,
        description: this.translate.instant('ETH Multisig Wallet creation'),
        multisigAddresses: this.multisigAddresses,
        requiredConfirmations: this.m,
        totalCopayers: this.n,
        coin: this.pairedWallet.coin,
        network,
        isEthMultisigInstantiation: true,
        multisigContractAddress: GnosisFactories[network], // address gnosis multisig contract
        toAddress: GnosisFactories[network] // address gnosis multisig contract
      }
    };
    this.events.publish('IncomingDataRedir', nextView);
  }
}
