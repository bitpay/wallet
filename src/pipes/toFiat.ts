import { Pipe, PipeTransform } from '@angular/core';
import { TxFormatProvider } from '../providers/tx-format/tx-format';
import { ConfigProvider } from '../providers/config/config';
import { DecimalPipe } from '@angular/common';

@Pipe({ name: 'toFiat' })
export class ToFiatPipe implements PipeTransform {
  private unitCode: string;
  private alternativeIsoCode: string;

  constructor(
    private configProvider: ConfigProvider,
    private txFormatProvider: TxFormatProvider,
    private decimalPipe: DecimalPipe,
  ) { 
    this.unitCode = this.configProvider.get().wallet.settings.unitCode;
    this.alternativeIsoCode = this.configProvider.get().wallet.settings.alternativeIsoCode;
  }
  transform(value: string, satoshis: number): any {
    let amount = this.txFormatProvider.toFiat(this.unitCode, satoshis, this.alternativeIsoCode) || 0;
    return this.decimalPipe.transform(amount, '1.2-2') + ' ' + this.alternativeIsoCode;
  }
}