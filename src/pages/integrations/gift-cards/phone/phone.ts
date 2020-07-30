import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { countries } from 'countries-list';
import { NavController, NavParams } from 'ionic-angular';

import {
  ActionSheetProvider,
  GiftCardProvider,
  PlatformProvider
} from '../../../../providers';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { CardConfig } from '../../../../providers/gift-card/gift-card.types';
import {
  getPhoneCountryCodes,
  PhoneCountryCode
} from '../../../../providers/phone/phone';
import { ConfirmCardPurchasePage } from '../confirm-card-purchase/confirm-card-purchase';

@Component({
  selector: 'phone-page',
  templateUrl: 'phone.html'
})
export class PhonePage {
  public initialCountryCode: string;
  public country: PhoneCountryCode;
  public phoneForm: FormGroup;
  public phoneMask;
  public cardConfig: CardConfig;
  public title: string = 'Enable Mobile Payments?';

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private giftCardProvider: GiftCardProvider,
    private nav: NavController,
    private navParams: NavParams,
    public platformProvider: PlatformProvider
  ) {
    this.phoneForm = new FormGroup({
      phone: new FormControl('', Validators.requiredTrue),
      agreement: new FormControl(false, Validators.requiredTrue)
    });
    if (this.platformProvider.isIOS) this.title = 'Enable Apple Pay?';
    else if (this.platformProvider.isAndroid) this.title = 'Enable Google Pay?';
  }

  async ngOnInit() {
    this.cardConfig = this.navParams.get('cardConfig');
    const {
      phone,
      phoneCountryInfo: { phoneCountryCode, countryIsoCode }
    } = await this.giftCardProvider.getPhoneAndCountryCode();
    const savedPhoneCountry = getSavedPhoneCountryCode(
      phoneCountryCode,
      countryIsoCode
    );
    const validSavedPhone =
      savedPhoneCountry &&
      (!this.cardConfig.allowedPhoneCountries ||
        this.cardConfig.allowedPhoneCountries.includes(
          savedPhoneCountry.countryCode
        ));
    validSavedPhone
      ? this.prefillPhone(phone, savedPhoneCountry)
      : await this.initializeBlankPhoneInput();
    this.updateMaskAndValidators();
  }

  async initializeBlankPhoneInput() {
    const allowedPhoneCountries = this.cardConfig.allowedPhoneCountries;
    const userCountryCode = await this.giftCardProvider.getCountry();
    this.initialCountryCode =
      allowedPhoneCountries && !allowedPhoneCountries.includes(userCountryCode)
        ? allowedPhoneCountries[0]
        : userCountryCode;
    this.country = getPhoneCountryCodes().find(
      country => country.countryCode === this.initialCountryCode
    );
  }

  async prefillPhone(phone: string, phoneCountry: PhoneCountryCode) {
    this.country = phoneCountry;
    this.phoneForm.setValue({
      phone: phone.replace(phoneCountry.phone, ''),
      agreement: false
    });
  }

  public openPolicy() {
    let url = 'https://bitpay.com/about/privacy';
    this.externalLinkProvider.open(url);
  }

  public async openOnlyOneCountrySupportedSheet() {
    const countryCode = this.cardConfig.allowedPhoneCountries[0];
    const country = countries[countryCode];
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'one-phone-country',
      { country, countryCode }
    );
    infoSheet.present();
  }

  public async onCountryCodeClick(): Promise<void> {
    (this.cardConfig.allowedPhoneCountries || []).length === 1
      ? this.openOnlyOneCountrySupportedSheet()
      : this.openCountryCodeSheet();
  }

  public async openCountryCodeSheet(): Promise<void> {
    const phoneSheet = this.actionSheetProvider.createPhoneSheet({
      allowedPhoneCountries: this.cardConfig.allowedPhoneCountries
    });
    const sheetHeight = this.platformProvider.isCordova
      ? this.platformProvider.isIOS
        ? '50vh'
        : '70vh'
      : '90vh';
    await phoneSheet.present({
      maxHeight: sheetHeight,
      minHeight: sheetHeight
    });
    phoneSheet.onDidDismiss(country => {
      if (!country) return;
      this.country = country;
      this.updateMaskAndValidators();
    });
  }

  public updateMaskAndValidators() {
    this.phoneMask = getPhoneMask(this.country.phone);
    this.phoneForm.get('phone').setValidators(getValidators(this.country));
  }

  public next(decline?: boolean) {
    const params = {
      ...this.navParams.data,
      phone: this.getPhoneValueFromForm(decline)
    };
    this.nav.push(ConfirmCardPurchasePage, params);
    if (!decline)
      this.giftCardProvider.savePhone(params.phone, {
        phoneCountryCode: this.country.phone,
        countryIsoCode: this.country.countryCode
      });
  }

  public getPhoneValueFromForm(decline?: boolean): string | undefined {
    const number = this.phoneForm
      .get('phone')
      .value.replace(/\D/g, '')
      .replace(/\D/g, '');
    return number && !decline ? `${this.country.phone}${number}` : undefined;
  }
}

function getValidators(country: PhoneCountryCode): ValidatorFn {
  const isUS = country.phone === '1';
  return Validators.compose([
    Validators.required,
    Validators.pattern(/[0-9]/),
    Validators.minLength(isUS ? 14 : 0)
  ]);
}

function getPhoneMask(phoneCountryCode) {
  const usMask = [
    '(',
    /[1-9]/,
    /\d/,
    /\d/,
    ')',
    ' ',
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
    /\d/
  ];
  return phoneCountryCode === '1' ? usMask : Array(15).fill(/\d/);
}

function getSavedPhoneCountryCode(
  phoneCountryCode: string,
  countryIsoCode: string
): PhoneCountryCode {
  const countryCodes = getPhoneCountryCodes();
  return countryCodes.find(
    countryCodeObj =>
      countryCodeObj.phone === phoneCountryCode &&
      countryIsoCode === countryCodeObj.countryCode
  );
}
