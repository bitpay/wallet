import { Pipe, PipeTransform } from '@angular/core';
import { TxFormatProvider } from '../providers/tx-format/tx-format';
import { ConfigProvider } from '../providers/config/config';
import { DecimalPipe } from '@angular/common';

@Pipe({ name: 'satToFiat' })
export class SatToFiatPipe implements PipeTransform {
  private walletSettings: any;

  constructor(
    private configProvider: ConfigProvider,
    private txFormatProvider: TxFormatProvider,
    private decimalPipe: DecimalPipe,
  ) { 
    this.walletSettings = this.configProvider.get().wallet.settings;
  }
  transform(value: string, satoshis: number): any {
    let amount = this.txFormatProvider.toFiat(this.walletSettings.unitCode, satoshis, this.walletSettings.alternativeIsoCode) || 0;
    return this.decimalPipe.transform(amount, '1.2-2') + ' ' + this.walletSettings.alternativeIsoCode;
  }
}