import { ChangeDetectorRef, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, NavController } from 'ionic-angular';

import * as _ from 'lodash';

import { animate, style, transition, trigger } from '@angular/animations';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BitPayAccountProvider } from '../../../../../../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../../../../../../providers/bitpay-card/bitpay-card';
import { CardPhasesProvider } from '../../../../../../providers/card-phases/card-phases';
import { ExternalLinkProvider } from '../../../../../../providers/external-link/external-link';
import { PersistenceProvider } from '../../../../../../providers/persistence/persistence';
import { PopupProvider } from '../../../../../../providers/popup/popup';

const AllowedCountries = [
  'FR',
  'DE',
  'NL',
  'IT',
  'ES',
  'PL',
  'AT',
  'BE',
  'CY',
  'EE',
  'FI',
  'GR',
  'IE',
  'LV',
  'LT',
  'LU',
  'MT',
  'PT',
  'SK',
  'BG',
  'HR',
  'CZ',
  'DK',
  'HU',
  'RO',
  'SE',
  'CH',
  'GB',
  'NO',
  'GI',
  'AD',
  'MC',
  'SM',
  'LI',
  'ISL',
  'SI',
  'CA',
  'US',
  'AUS',
  'AU'
];

@Component({
  selector: 'page-bitpay-phase-one-card-intro',
  templateUrl: './phase-one-intro-page.html',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '400ms 100ms ease',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ])
  ]
})
export class PhaseOneCardIntro {
  public accounts;
  public notifyForm: FormGroup;
  public joinWaitlist: boolean;
  public complete: boolean;
  public countrySelected: boolean;
  public country = 'US';
  public countryList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  constructor(
    private translate: TranslateService,
    private actionSheetCtrl: ActionSheetController,
    private bitPayAccountProvider: BitPayAccountProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private cardPhasesProvider: CardPhasesProvider,
    private externalLinkProvider: ExternalLinkProvider,
    public navCtrl: NavController,
    private popupProvider: PopupProvider,
    private persistenceProvider: PersistenceProvider,
    private changeRef: ChangeDetectorRef
  ) {
    this.notifyForm = new FormGroup({
      email: new FormControl(
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(
            /(?:[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[A-Za-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[A-Za-z0-9-]*[A-Za-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
          )
        ])
      ),
      agreement: new FormControl(false, Validators.requiredTrue)
    });

    this.persistenceProvider.getCountries().then(data => {
      if (data) {
        this.countryList = data.filter(c =>
          AllowedCountries.includes(c.shortCode)
        );
      }
    });
  }

  ionViewWillEnter() {
    this.bitPayAccountProvider.getAccounts((err, accounts) => {
      if (err) {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
        return;
      }
      this.accounts = accounts;
    });
  }

  public bitPayCardInfo() {
    let url = 'https://bitpay.com/visa/faq';
    this.externalLinkProvider.open(url);
  }

  public goBack() {
    this.navCtrl.pop();
  }

  public async joinList() {
    const status = await this.persistenceProvider.getWaitingListStatus();
    if (status) {
      this.country = status.split('=')[1];
      this.complete = true;
    } else {
      this.joinWaitlist = true;
    }
    this.changeRef.detectChanges();
  }

  public addMe() {
    const email = this.notifyForm.get('email').value;
    this.cardPhasesProvider.notify(email, this.country).subscribe(val => {
      if (val['data']['success']) {
        this.complete = true;
        setTimeout(() => {
          this.goBack();
          this.persistenceProvider.setWaitingListStatus(
            `onList?country=${this.country}`
          );
        }, 2000);
      }
    });
  }

  public openPolicy() {
    let url = 'https://bitpay.com/about/privacy';
    this.externalLinkProvider.open(url);
  }

  public async orderBitPayCard() {
    this.bitPayCardProvider.logEvent('legacycard_order', {});
    let url = 'https://bitpay.com/visa/get-started';
    this.externalLinkProvider.open(url);
  }

  public connectBitPayCard() {
    this.bitPayCardProvider.logEvent('legacycard_connect', {});
    if (this.accounts.length == 0) {
      this.startPairBitPayAccount();
    } else {
      this.showAccountSelector();
    }
  }

  private startPairBitPayAccount() {
    this.navCtrl.popToRoot({ animate: false }); // Back to Root
    let url = 'https://bitpay.com/visa/dashboard/add-to-bitpay-wallet-confirm';
    this.externalLinkProvider.open(url);
  }

  private showAccountSelector() {
    let options = [];

    _.forEach(this.accounts, account => {
      options.push({
        text:
          (account.givenName || account.familyName) +
          ' (' +
          account.email +
          ')',
        handler: () => {
          this.onAccountSelect(account);
        }
      });
    });

    // Add account
    options.push({
      text: this.translate.instant('Add account'),
      handler: () => {
        this.onAccountSelect();
      }
    });

    // Cancel
    options.push({
      text: this.translate.instant('Cancel'),
      role: 'cancel'
    });

    let actionSheet = this.actionSheetCtrl.create({
      title: this.translate.instant('From BitPay account'),
      buttons: options
    });
    actionSheet.present();
  }

  private onAccountSelect(account?): void {
    if (_.isUndefined(account)) {
      this.startPairBitPayAccount();
    } else {
      this.bitPayCardProvider.sync(account.apiContext, err => {
        if (err) {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        }
        this.navCtrl.pop();
      });
    }
  }
}
