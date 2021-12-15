import { FormControl } from '@angular/forms';
import { AddressProvider } from '../providers/address/address';

// Providers

export class AddressValidator {
  static addressProvider: AddressProvider;

  constructor(addressProvider: AddressProvider) {
    AddressValidator.addressProvider = addressProvider;
  }

  isValid(control: FormControl) {
    return AddressValidator.addressProvider.isValid(control.value)
      ? null
      : { 'Invalid Address': true };
  }
}
