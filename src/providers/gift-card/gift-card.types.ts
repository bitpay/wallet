export enum ClaimCodeType {
  barcode = 'barcode',
  code = 'code',
  link = 'link'
}

export interface GiftCardDiscount {
  hidden: boolean;
  code: string;
  type: 'percentage';
  amount: number;
}

export interface CommonCardConfig {
  cardImage: string;
  currency: string;
  defaultClaimCodeType: ClaimCodeType;
  description?: string;
  discounts?: GiftCardDiscount[];
  displayName: string;
  emailRequired: boolean;
  featured?: boolean;
  hidden?: boolean;
  hidePin?: boolean;
  icon: string;
  logo: string;
  logoBackgroundColor: string;
  minAmount?: number;
  maxAmount?: number;
  printRequired?: boolean;
  redeemInstructions?: string;
  redeemUrl?: string;
  terms: string;
  website: string;
}

export interface CardConfig extends CommonCardConfig {
  brand?: string; // deprecated
  name: string;
  supportedAmounts?: number[];
}

export interface GiftCard {
  accessKey: string;
  amount: number;
  archived: boolean;
  barcodeImage?: string;
  claimCode: string;
  claimLink?: string;
  currency: string;
  date: number;
  displayName: string;
  invoiceId: string;
  invoiceTime?: number;
  invoiceUrl: string;
  name: string;
  pin?: string;
  status: string;
  uuid: string;
}

export type GiftCardSaveParams = Partial<{
  error: string;
  status: string;
  remove: boolean;
}>;

export interface ApiCard extends CommonCardConfig {
  amount?: number;
  type: 'fixed' | 'range';
}

export type ApiCardConfig = ApiCard[];

export interface AvailableCardMap {
  [cardName: string]: ApiCardConfig;
}

export interface CardConfigMap {
  [cardName: string]: CardConfig;
}
