import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Events, NavController, NavParams } from 'ionic-angular';

// providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { AppProvider } from '../../../../providers/app/app';
import { CurrencyProvider } from '../../../../providers/currency/currency';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';

// validators
import { AddressValidator } from '../../../../validators/address';
import { ScanPage } from '../../../scan/scan';

@Component({
  selector: 'page-addressbook-add',
  templateUrl: 'add.html'
})
export class AddressbookAddPage {
  public addressBookAdd: FormGroup;
  public isCordova: boolean;
  public appName: string;
  public isXRP: boolean;
  public addressInfo;
  public networks;
  public coins: string[];
  public allowNetworkSelection: boolean;

  private destinationTagregex: RegExp;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private events: Events,
    private ab: AddressBookProvider,
    private currencyProvider: CurrencyProvider,
    private addressProvider: AddressProvider,
    private appProvider: AppProvider,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private popupProvider: PopupProvider
  ) {
    this.networks = ['livenet', 'testnet'];
    this.destinationTagregex = /^[0-9]{1,}$/;
    this.addressBookAdd = this.formBuilder.group({
      name: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ],
      email: ['', this.emailOrEmpty],
      address: [
        '',
        Validators.compose([
          Validators.required,
          new AddressValidator(this.addressProvider).isValid
        ])
      ],
      tag: ['', Validators.pattern(this.destinationTagregex)],
      network: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ],
      coin: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
    if (this.navParams.data.addressbookEntry) {
      this.addressBookAdd.controls['address'].setValue(
        this.navParams.data.addressbookEntry
      );
    }
    this.appName = this.appProvider.info.nameCase;
    this.events.subscribe('Local/AddressScan', this.updateAddressHandler);
    this.addressBookAdd
      .get('address')
      .valueChanges.subscribe(val => this.analizeAddress(val));
  }

  analizeAddress(address: string, network?: string, coin?: string) {
    this.coins = [];
    this.addressInfo = undefined;
    this.isXRP = false;
    if (address && this.addressBookAdd.get('address').valid) {
      this.addressInfo = this.addressProvider.getCoinAndNetwork(
        address,
        network
      );
      if (this.addressInfo) {
        this.isXRP = this.addressInfo.coin === 'xrp';
        this.addressBookAdd.controls['network'].setValue(
          this.addressInfo.network
        );
        const chain = this.currencyProvider.getChain(this.addressInfo.coin);
        this.coins.push(chain);
        this.addressBookAdd.controls['network'].disable();
        this.allowNetworkSelection = false;
        if (['XRP', 'ETH'].includes(chain.toUpperCase())) {
          this.addressBookAdd.controls['network'].enable();
          this.allowNetworkSelection = true;
          if (chain.toUpperCase() === 'ETH') {
            this.coins.push(
              ...this.currencyProvider.availableTokens.map(t => t.symbol)
            );
          }
        }
      }

      if (this.coins && this.coins.find(c => c.toUpperCase() === coin.toUpperCase())) {
        this.addressBookAdd.controls['coin'].setValue(coin);
      } else {
        this.addressBookAdd.controls['coin'].setValue(this.addressInfo.coin);
      }
    }
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddressbookAddPage');
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/AddressScan', this.updateAddressHandler);
  }

  private updateAddressHandler: any = data => {
    if (
      this.destinationTagregex.test(data.value) &&
      this.addressBookAdd.value.address &&
      this.getCoinAndNetwork() &&
      this.getCoinAndNetwork().coin === 'xrp'
    ) {
      this.addressBookAdd.controls['tag'].setValue(data.value);
    } else {
      this.addressBookAdd.controls['address'].setValue(
        this.parseAddress(data.value)
      );
    }
  };

  private emailOrEmpty(control: AbstractControl): ValidationErrors | null {
    return control.value === '' ? null : Validators.email(control);
  }

  public save(): void {
    this.ab
      .add({
        name: this.addressBookAdd.value.name,
        email: this.addressBookAdd.value.email,
        address: this.parseAddress(this.addressBookAdd.value.address),
        tag: this.addressBookAdd.value.tag,
        network: this.addressBookAdd.value.network,
        coin: this.addressBookAdd.value.coin
      })
      .then(() => {
        this.navCtrl.pop();
      })
      .catch(err => {
        this.popupProvider.ionicAlert('Error', err);
      });
  }

  private parseAddress(str: string): string {
    return this.addressProvider.extractAddress(str);
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromAddressbook: true });
  }

  public getCoinAndNetwork(): { coin: string; network: string } {
    return this.addressProvider.getCoinAndNetwork(
      this.addressBookAdd.value.address
    );
  }
}
