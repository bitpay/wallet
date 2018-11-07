export enum CardBrand {
  amazon = 'Amazon',
  delta = 'Delta',
  hotelsCom = 'Hotels.com',
  mercadoLibre = 'Mercado Livre',
  uber = 'Uber',
  uberEats = 'Uber Eats',
  venue = 'Venue'
}

export enum CardName {
  amazon = 'Amazon.com',
  amazonJapan = 'Amazon.co.jp',
  delta = 'Delta Air Lines',
  hotelsCom = 'Hotels.com',
  mercadoLibre = 'Mercado Livre',
  uber = 'Uber',
  uberEats = 'Uber Eats',
  venue = 'Venue USD'
}

export interface BaseCardConfig {
  brand: CardBrand;
  cardImage: string;
  defaultClaimCodeType: 'barcode' | 'link' | 'code';
  emailRequired: boolean;
  icon: string;
  logo: string;
  logoBackgroundColor: string;
  name: CardName;
  redeemUrl?: string;
  website: string;
}

export interface ApiCardConfig {
  currency: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  redeemInstructions?: string;
  supportedAmounts?: number[];
  terms: string;
}

export interface CardConfig extends BaseCardConfig, ApiCardConfig {}

export interface GiftCard {
  accessKey: string;
  amount: number;
  archived: boolean;
  brand: CardBrand;
  claimCode: string;
  claimLink?: string;
  currency: string;
  date: number;
  invoiceId: string;
  invoiceTime?: number;
  invoiceUrl: string;
  name: CardName;
  pin?: string;
  status: string;
  uuid: string;
}

export type GiftCardSaveParams = Partial<{
  error: string;
  status: string;
  remove: boolean;
}>;

export interface ApiCard {
  amount?: number;
  currency: string;
  description: string;
  minAmount?: number;
  maxAmount?: number;
  redeemInstructions?: string;
  terms: string;
  type: 'fixed' | 'range';
}

export type ApiBrandConfig = ApiCard[];

export type AvailableCardMap = {
  [T in keyof typeof CardName]?: ApiBrandConfig
};
