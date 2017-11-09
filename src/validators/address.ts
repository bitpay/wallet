import { FormControl } from '@angular/forms';
import { BwcProvider } from '../providers/bwc/bwc';

export class AddressValidator {

  static bitcore: BwcProvider;

  constructor(bwc: BwcProvider) {
    AddressValidator.bitcore = bwc;
  }

  isValid(control: FormControl): any {

    let b = AddressValidator.bitcore.getBitcore();
    let c = AddressValidator.bitcore.getBitcoreCash();

    let URI = b.URI;
    let Address = b.Address;
    let URICash = c.URI;
    let AddressCash = c.Address;

    // Regular url
    if (/^https?:\/\//.test(control.value)) {
      return null;
    }

    // Bip21 uri
    let uri, isAddressValidLivenet, isAddressValidTestnet;
    if (/^bitcoin:/.test(control.value)) {
      let isUriValid = URI.isValid(control.value);
      if (isUriValid) {
        uri = new URI(control.value);
        isAddressValidLivenet = Address.isValid(uri.address.toString(), 'livenet')
        isAddressValidTestnet = Address.isValid(uri.address.toString(), 'testnet')
      }
      if (isUriValid && (isAddressValidLivenet || isAddressValidTestnet)) {
        return null;
      }
    } else if (/^bitcoincash:/.test(control.value)) {
      let isUriValid = URICash.isValid(control.value);
      if (isUriValid) {
        uri = new URICash(control.value);
        isAddressValidLivenet = AddressCash.isValid(uri.address.toString(), 'livenet')
      }
      if (isUriValid && isAddressValidLivenet) {
        return null;
      }
    }

    // Regular Address: try Bitcoin and Bitcoin Cash
    let regularAddressLivenet = Address.isValid(control.value, 'livenet');
    let regularAddressTestnet = Address.isValid(control.value, 'testnet');
    let regularAddressCashLivenet = AddressCash.isValid(control.value, 'livenet');
    if (regularAddressLivenet || regularAddressTestnet || regularAddressCashLivenet) {
      return null;
    }

    return {
      "Invalid Address": true
    };
  }
}
