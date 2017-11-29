import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { BwcProvider } from '../../../../providers/bwc/bwc';
import { AddressBookProvider } from '../../../../providers/address-book/address-book';
import { AddressValidator } from '../../../../validators/address';

@Component({
  selector: 'page-addressbook-add',
  templateUrl: 'add.html',
})
export class AddressbookAddPage {

  private addressBookAdd: FormGroup;

  public submitAttempt: boolean = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public bwc: BwcProvider,
    public ab: AddressBookProvider,
    public formBuilder: FormBuilder
  ) {
    this.addressBookAdd = this.formBuilder.group({
      name: ['', Validators.compose([Validators.required, Validators.pattern('[a-zA-Z0-9 ]*')])],
      email: ['', this.emailOrEmpty],
      address: ['', Validators.compose([Validators.required, new AddressValidator(bwc).isValid])]
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddressbookAddPage');
  }

  ionViewWillEnter() {
    this.addressBookAdd.value.address = this.navParams.data.addressbookEntry;
  }

  private emailOrEmpty(control: AbstractControl): ValidationErrors | null {
    return control.value === '' ? null : Validators.email(control);
  }

  public save() {
    this.submitAttempt = true;

    if (this.addressBookAdd.valid) {
      this.ab.add(this.addressBookAdd.value).then((ab) => {
        this.navCtrl.pop();

      }).catch((err) => {
        let opts = {
          title: err,
          buttons: [{
            text: 'OK',
            handler: () => {
              this.navCtrl.pop();
            }
          }],
        }
        this.alertCtrl.create(opts).present();
      });
    }
    else {
      let opts = {
        title: 'Error',
        message: 'Could not save the contact',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.navCtrl.pop();
          }
        }],
      }
      this.alertCtrl.create(opts).present();
    }
  }

}
