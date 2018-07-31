import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {
  AlertController,
  Events,
  NavController,
  NavParams
} from 'ionic-angular';

// providers
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressProvider } from '../../../../providers/address/address';
import { Logger } from '../../../../providers/logger/logger';

// validators
import { AddressValidator } from '../../../../validators/address';
import { ScanPage } from '../../../scan/scan';

@Component({
  selector: 'page-addressbook-add',
  templateUrl: 'add.html'
})
export class AddressbookAddPage {
  private addressBookAdd: FormGroup;

  public submitAttempt: boolean = false;
  public isCordova: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private events: Events,
    private alertCtrl: AlertController,
    private ab: AddressBookProvider,
    private addressProvider: AddressProvider,
    private formBuilder: FormBuilder,
    private logger: Logger
  ) {
    this.addressBookAdd = this.formBuilder.group({
      name: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern('[a-zA-Z0-9 ]*')
        ])
      ],
      email: ['', this.emailOrEmpty],
      address: [
        '',
        Validators.compose([
          Validators.required,
          new AddressValidator(this.addressProvider).isValid
        ])
      ]
    });
    if (this.navParams.data.addressbookEntry) {
      this.addressBookAdd.controls['address'].setValue(
        this.navParams.data.addressbookEntry
      );
    }
    this.events.subscribe('update:address', data => {
      let address = data.value.replace(/^bitcoin(cash)?:/, '');
      this.addressBookAdd.controls['address'].setValue(address);
    });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AddressbookAddPage');
  }

  private emailOrEmpty(control: AbstractControl): ValidationErrors | null {
    return control.value === '' ? null : Validators.email(control);
  }

  public save(): void {
    this.submitAttempt = true;

    if (this.addressBookAdd.valid) {
      this.ab
        .add(this.addressBookAdd.value)
        .then(() => {
          this.navCtrl.pop();
          this.submitAttempt = false;
        })
        .catch(err => {
          let opts = {
            title: err,
            buttons: [
              {
                text: 'OK',
                handler: () => {
                  this.navCtrl.pop();
                }
              }
            ]
          };
          this.alertCtrl.create(opts).present();
          this.submitAttempt = false;
        });
    } else {
      let opts = {
        title: 'Error',
        message: 'Could not save the contact',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.navCtrl.pop();
            }
          }
        ]
      };
      this.alertCtrl.create(opts).present();
      this.submitAttempt = false;
    }
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromAddressbook: true });
  }
}
