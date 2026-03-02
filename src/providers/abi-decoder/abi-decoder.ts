import { Injectable } from '@angular/core';
import { ERC20Abi } from './abi-erc20';
import { InvoiceAbi } from './abi-invoice';

import * as abiDecoder from 'abi-decoder';

@Injectable()
export class AbiDecoderProvider {
  erc20Decoder;
  invoiceDecoder;

  constructor() {
    this.erc20Decoder = abiDecoder;
    this.erc20Decoder.addABI(ERC20Abi);

    this.invoiceDecoder = abiDecoder;
    this.invoiceDecoder.addABI(InvoiceAbi);
  }

  public decodeInvoiceData(data: string) {
    const decodedData = this.invoiceDecoder.decodeMethod(data);
    return decodedData;
  }

  public decodeERC20Data(data: string) {
    const decodedData = this.erc20Decoder.decodeMethod(data);
    return decodedData;
  }
}
