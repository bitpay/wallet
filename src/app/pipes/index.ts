import { FiatToUnitPipe } from './fiatToUnit';
import { FormatCurrencyPipe } from './format-currency';
import { KeysPipe } from './keys';
import { OrderByPipe } from './order-by';
import { SatToFiatPipe } from './satToFiat';
import { SatToUnitPipe } from './satToUnit';
import { ShortenedAddressPipe } from './shortened-address';


export const sharedPipes: any[] = [
    FiatToUnitPipe,
    FormatCurrencyPipe,
    KeysPipe,
    OrderByPipe,
    SatToFiatPipe,
    SatToUnitPipe,
    ShortenedAddressPipe
];

export * from './fiatToUnit';
export * from './format-currency';
export * from './keys';
export * from './order-by';
export * from './satToFiat';
export * from './satToUnit';
export * from './shortened-address';
