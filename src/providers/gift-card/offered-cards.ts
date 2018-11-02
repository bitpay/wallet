import { BaseCardConfig, CardBrand, CardName } from './gift-card.types';

export const offeredGiftCards: BaseCardConfig[] = [
  {
    brand: CardBrand.venue, // For Testnet
    cardImage: 'https://app.giftango.com/GPCGraphics/CIR_000717_00.png',
    defaultClaimCodeType: 'code',
    emailRequired: false,
    icon: 'https://app.giftango.com/GPCGraphics/CIR_000717_00.png',
    logo: 'https://app.giftango.com/GPCGraphics/CIR_000717_00.png',
    logoBackgroundColor: '#913318',
    name: CardName.venue,
    website: 'venue.com'
  },
  {
    brand: CardBrand.amazon,
    cardImage: 'assets/img/gift-cards/amazon/amazon-gift-card.png',
    defaultClaimCodeType: 'code',
    emailRequired: true,
    icon: 'assets/img/gift-cards/amazon/amazon-icon.svg',
    logo: 'assets/img/gift-cards/amazon/amazon-logo.png',
    logoBackgroundColor: '#363636',
    name: CardName.amazon,
    redeemUrl: 'https://www.amazon.com/gc/redeem?claimCode=',
    website: 'amazon.com'
  },
  {
    brand: CardBrand.amazon,
    cardImage: 'assets/img/gift-cards/amazon/amazon-japan-gift-card.png',
    defaultClaimCodeType: 'code',
    emailRequired: true,
    icon: 'assets/img/gift-cards/amazon/amazon-icon.svg',
    logo: 'assets/img/gift-cards/amazon/amazon-logo.png',
    logoBackgroundColor: '#363636',
    name: CardName.amazonJapan,
    redeemUrl: 'https://www.amazon.co.jp/gc/redeem?claimCode=',
    website: 'amazon.co.jp'
  },
  {
    brand: CardBrand.delta,
    cardImage: 'assets/img/gift-cards/delta/delta-gift-card-white.png',
    defaultClaimCodeType: 'link',
    emailRequired: false,
    icon: 'assets/img/gift-cards/delta/delta-icon-white.svg',
    logo: 'assets/img/gift-cards/delta/delta-logo-white.svg',
    logoBackgroundColor: '#ffffff',
    name: CardName.delta,
    website: 'delta.com'
  },
  {
    brand: CardBrand.hotelsCom,
    cardImage: 'assets/img/gift-cards/hotels.com/hotels.com-card.png',
    defaultClaimCodeType: 'code',
    emailRequired: false,
    icon: 'assets/img/gift-cards/hotels.com/hotels.com-icon.svg',
    logo: 'assets/img/gift-cards/hotels.com/hotels.com-logo.svg',
    logoBackgroundColor: '#DB4545',
    name: CardName.hotelsCom,
    website: 'hotels.com'
  },
  {
    brand: CardBrand.mercadoLibre,
    cardImage: 'assets/img/gift-cards/mercado-libre/mercado-livre-card.png',
    defaultClaimCodeType: 'code',
    emailRequired: false,
    icon: 'assets/img/gift-cards/mercado-libre/mercado-livre-icon.svg',
    logo: 'assets/img/gift-cards/mercado-libre/mercado-livre-logo.png',
    logoBackgroundColor: '#ffffff',
    name: CardName.mercadoLibre,
    website: 'mercadolivre.com.br'
  },
  {
    brand: CardBrand.uber,
    cardImage: 'assets/img/gift-cards/uber/uber-gift-card.png',
    defaultClaimCodeType: 'code',
    emailRequired: false,
    icon: 'assets/img/gift-cards/uber/uber-icon.svg',
    logo: 'assets/img/gift-cards/uber/uber-logo.png',
    logoBackgroundColor: '#000000',
    name: CardName.uber,
    website: 'uber.com'
  },
  {
    brand: CardBrand.uberEats,
    cardImage: 'assets/img/gift-cards/uber-eats/uber-eats-card.png',
    defaultClaimCodeType: 'code',
    emailRequired: false,
    icon: 'assets/img/gift-cards/uber-eats/uber-eats-icon.svg',
    logo: 'assets/img/gift-cards/uber-eats/uber-eats-logo.svg',
    logoBackgroundColor: '#000000',
    name: CardName.uberEats,
    website: 'uber.com'
  }
];
