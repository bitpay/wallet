import { Pipe, PipeTransform } from '@angular/core';
import { IncomingDataProvider } from '../providers/incoming-data/incoming-data';
@Pipe({
  name: 'shortenedAddress',
  pure: false
})
export class ShortenedAddressPipe implements PipeTransform {
  constructor(private incomingDataProvider: IncomingDataProvider) {}
  transform(address: string) {
    if (!address || address === '') return '...';
    const addr = this.incomingDataProvider.extractAddress(address);
    if (addr && addr.length > 4) {
      const first4Numbers = addr.substr(0, 4);
      const last4Numbers = addr.substr(addr.length - 4, addr.length);
      const result = first4Numbers + '...' + last4Numbers;
      return result;
    } else {
      return '...';
    }
  }
}
