export enum CardBrand {
  amazon = 'Amazon',
  mercadoLibre = 'Mercado Livre'
}

export enum CardName {
  amazon = 'Amazon.com',
  amazonJapan = 'Amazon.co.jp',
  mercadoLibre = 'Mercado Livre'
}

export interface CardConifg {
  brand: CardBrand;
  cardImage: string;
  currency: string;
  emailRequired: boolean;
  icon: string;
  maxAmount: number;
  minAmount: number;
  name: CardName;
  bitpayApiPath: string;
  redeemUrl: string;
  website: string;
}

export interface GiftCard {
  accessKey: string;
  amount: number;
  archived: boolean;
  brand: CardBrand;
  claimCode: string;
  currency: string;
  date: number;
  invoiceId: string;
  invoiceTime?: number;
  invoiceUrl: string;
  name: CardName;
  status: string;
  uuid: string;
}

/*
  Hopefully we'll standardize our redeem endpoint and these temporary interfaces
  will no longer be necessary.
*/
export interface TemporaryMercadoLibreResponse {
  cardStatus: string;
  pin: string;
}

export interface TemporaryAmazonResponse {
  status: string;
  gcId: string;
  cardStatus: string;
  amount: number;
  currency: string;
  claimCode: string;
}

export type RedeemResponse = TemporaryMercadoLibreResponse &
  TemporaryAmazonResponse;

export enum LegacyCardServiceName {
  amazon = 'amazon',
  mercadoLibre = 'mercadolibre'
}
