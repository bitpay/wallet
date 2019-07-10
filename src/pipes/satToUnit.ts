import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { ConfigProvider } from '../providers/config/config';

@Pipe({
  name: 'satToUnit',
  pure: false
})
export class SatToUnitPipe implements PipeTransform {
  constructor(
    private decimalPipe: DecimalPipe,
    private configProvider: ConfigProvider
  ) {}
  transform(amount: number, coin: string) {
    const { unitToSatoshi } = this.configProvider.get().wallet.settings;
    return (
      this.decimalPipe.transform(amount / unitToSatoshi, '1.2-6') +
      ' ' +
      coin.toUpperCase()
    );
  }
}
