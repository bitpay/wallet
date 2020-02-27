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
  private regex: RegExp;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private events: Events,
    private ab: AddressBookProvider,
    private addressProvider: AddressProvider,
    private appProvider: AppProvider,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private popupProvider: PopupProvider
  ) {
    this.regex = /^[0-9]{9,}$/;
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
      tag: ['', Validators.pattern(this.regex)]
    });
    if (this.navParams.data.addressbookEntry) {
      this.addressBookAdd.controls['address'].setValue(
        this.navParams.data.addressbookEntry
      );
    }
    this.appName = this.appProvider.info.nameCase;
    this.events.subscribe('Local/AddressScan', this.updateAddressHandler);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddressbookAddPage');
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/AddressScan', this.updateAddressHandler);
  }

  private updateAddressHandler: any = data => {
    if (
      this.regex.test(data.value) &&
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
    this.addressBookAdd.controls['address'].setValue(
      this.parseAddress(this.addressBookAdd.value.address)
    );
    this.ab
      .add(this.addressBookAdd.value)
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
