export enum CardName {
  amazon = 'Amazon.com',
  amazonJapan = 'Amazon.co.jp',
  amc = 'AMC Theatres',
  barnesNoble = 'Barnes & Noble',
  bassProShops = 'Bass Pro Shops',
  burgerKing = 'BURGER KING',
  carnivalCruiseLine = 'Carnival Cruise Line',
  delta = 'Delta Air Lines',
  dsw = 'DSW',
  gamestop = 'GameStop',
  googlePlay = 'Google Play',
  homeDepot = 'Home Depot',
  hotelsCom = 'Hotels.com',
  mercadoLibre = 'Mercado Livre',
  nike = 'Nike',
  papaJohns = "Papa John's",
  pfChangs = "P.F. Chang's",
  potteryBarn = 'Pottery Barn',
  royalCaribbean = 'Royal Caribbean',
  sonyPlayStation = 'Sony PlayStation',
  spotify = 'Spotify',
  uber = 'Uber',
  uberEats = 'Uber Eats',
  venue = 'Venue USD',
  xboxLive = 'Xbox'
}

export enum CardBrand {
  amazon = 'Amazon',
  amc = 'AMC Theatres',
  barnesNoble = 'Barnes & Noble',
  bassProShops = 'Bass Pro Shops',
  burgerKing = 'Burger King',
  carnivalCruiseLine = 'Carnival Cruise Line',
  delta = 'Delta',
  dsw = 'DSW',
  gamestop = 'GameStop',
  googlePlay = 'Google Play',
  homeDepot = 'Home Depot',
  hotelsCom = 'Hotels.com',
  mercadoLibre = 'Mercado Livre',
  nike = 'Nike',
  papaJohns = "Papa John's",
  pfChangs = "P.F. Chang's",
  potteryBarn = 'Pottery Barn',
  royalCaribbean = 'Royal Caribbean',
  sonyPlayStation = 'PlayStation Store',
  spotify = 'Spotify',
  uber = 'Uber',
  uberEats = 'Uber Eats',
  venue = 'Venue',
  xboxLive = 'Xbox Live'
}

export enum ClaimCodeType {
  barcode = 'barcode',
  code = 'code',
  link = 'link'
}

export interface BaseCardConfig {
  brand: CardBrand;
  cardImage: string;
  defaultClaimCodeType: ClaimCodeType;
  emailRequired: boolean;
  icon: string;
  logo: string;
  logoBackgroundColor: string;
  name: CardName;
  redeemUrl?: string;
  hidePin?: boolean;
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
