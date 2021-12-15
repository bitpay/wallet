import { Location } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { EventManagerService } from 'src/app/providers/event-manager.service';

// providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { AppProvider } from '../../../../providers/app/app';
import { CurrencyProvider } from '../../../../providers/currency/currency';
import { Logger } from '../../../../providers/logger/logger';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';

// validators
import { AddressValidator } from '../../../../validators/address';

@Component({
  selector: 'page-addressbook-add',
  templateUrl: 'add.html',
  styleUrls: ['add.scss']
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
  navParamsData;

  constructor(
    private router: Router,
    private location: Location,
    private events: EventManagerService,
    private ab: AddressBookProvider,
    private currencyProvider: CurrencyProvider,
    private addressProvider: AddressProvider,
    private appProvider: AppProvider,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private popupProvider: PopupProvider
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
    this.networks = ['livenet', 'testnet'];
    this.isCordova = this.platformProvider.isCordova;
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
    if (this.navParamsData?.addressbookEntry) {
      this.addressBookAdd.controls['address'].setValue(
        this.navParamsData?.addressbookEntry
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

      if (
        this.coins &&
        coin &&
        this.coins.find(c => c.toUpperCase() === coin.toUpperCase())
      ) {
        this.addressBookAdd.controls['coin'].setValue(coin);
      } else {
        this.addressBookAdd.controls['coin'].setValue(this.addressInfo.coin);
      }
    }
  }

  ngOnInit(){
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
        this.location.back();
      })
      .catch(err => {
        this.popupProvider.ionicAlert('Error', err);
      });
  }

  private parseAddress(str: string): string {
    return this.addressProvider.extractAddress(str);
  }

  public openScanner(): void {
    this.router.navigate(['scan'], {state: {fromAddressbook: true}})
  }

  public getCoinAndNetwork(): { coin: string; network: string } {
    return this.addressProvider.getCoinAndNetwork(
      this.addressBookAdd.value.address
    );
  }
}
