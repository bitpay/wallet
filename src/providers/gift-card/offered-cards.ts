import {
  BaseCardConfig,
  CardBrand,
  CardName,
  ClaimCodeType
} from './gift-card.types';

export const offeredGiftCards: BaseCardConfig[] = ([
  {
    brand: CardBrand.venue, // For Testnet
    cardImage: `${getCardImageDirectory(CardName.venue)}/card.png`,
    defaultClaimCodeType: 'code',
    emailRequired: false,
    icon: `${getCardImageDirectory(CardName.venue)}/card.png`,
    logo: `${getCardImageDirectory(CardName.venue)}/card.png`,
    logoBackgroundColor: '#913318',
    name: CardName.venue,
    website: 'venue.com'
  },
  {
    brand: CardBrand.amazon,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: true,
    logoBackgroundColor: '#363636',
    name: CardName.amazon,
    redeemUrl: 'https://www.amazon.com/gc/redeem?claimCode=',
    website: 'amazon.com'
  },
  {
    brand: CardBrand.amazon,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: true,
    logoBackgroundColor: '#363636',
    name: CardName.amazonJapan,
    redeemUrl: 'https://www.amazon.co.jp/gc/redeem?claimCode=',
    website: 'amazon.co.jp'
  },
  {
    brand: CardBrand.amc,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    logo: `${getCardImageDirectory(CardName.amc)}logo.png`,
    logoBackgroundColor: '#CF2339',
    name: CardName.amc,
    website: 'amctheaters.com'
  },
  {
    brand: CardBrand.barnesNoble,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    logoBackgroundColor: '#356251',
    name: CardName.barnesNoble,
    website: 'barnesandnoble.com'
  },
  {
    brand: CardBrand.bassProShops,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    icon: `${getCardImageDirectory(CardName.bassProShops)}icon.png`,
    logo: `${getCardImageDirectory(CardName.bassProShops)}logo.png`,
    logoBackgroundColor: '#ffffff',
    name: CardName.bassProShops,
    website: 'basspro.com'
  },
  {
    brand: CardBrand.burgerKing,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    logoBackgroundColor: '#ffffff',
    name: CardName.burgerKing,
    website: 'bk.com'
  },
  {
    brand: CardBrand.carnivalCruiseLine,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    icon: `${getCardImageDirectory(CardName.carnivalCruiseLine)}icon.png`,
    logoBackgroundColor: '#ffffff',
    name: CardName.carnivalCruiseLine,
    website: 'carnival.com'
  },
  {
    brand: CardBrand.delta,
    defaultClaimCodeType: ClaimCodeType.link,
    emailRequired: false,
    logoBackgroundColor: '#ffffff',
    name: CardName.delta,
    website: 'delta.com'
  },
  {
    brand: CardBrand.dsw,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    logoBackgroundColor: '#000000',
    name: CardName.dsw,
    website: 'dsw.com'
  },
  {
    brand: CardBrand.gamestop,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    logoBackgroundColor: '#000000',
    name: CardName.gamestop,
    website: 'gamestop.com'
  },
  {
    brand: CardBrand.googlePlay,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    hidePin: true,
    icon: `${getCardImageDirectory(CardName.googlePlay)}icon.png`,
    logoBackgroundColor: '#ffffff',
    name: CardName.googlePlay,
    redeemUrl: 'https://play.google.com/redeem?code=',
    website: 'play.google.com'
  },
  {
    brand: CardBrand.homeDepot,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    logoBackgroundColor: '#E17232',
    name: CardName.homeDepot,
    website: 'homedepot.com'
  },
  {
    brand: CardBrand.hotelsCom,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    logoBackgroundColor: '#DB4545',
    name: CardName.hotelsCom,
    website: 'hotels.com'
  },
  {
    brand: CardBrand.mercadoLibre,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    logoBackgroundColor: '#ffffff',
    name: CardName.mercadoLibre,
    website: 'mercadolivre.com.br'
  },
  {
    brand: CardBrand.nike,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    logoBackgroundColor: '#F94617',
    name: CardName.nike,
    website: 'nike.com'
  },
  {
    brand: CardBrand.papaJohns,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    icon: `${getCardImageDirectory(CardName.papaJohns)}icon.png`,
    logo: `${getCardImageDirectory(CardName.papaJohns)}logo.png`,
    logoBackgroundColor: '#AC2A25',
    name: CardName.papaJohns,
    website: 'papajohns.com'
  },
  {
    brand: CardBrand.pfChangs,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    icon: `${getCardImageDirectory(CardName.pfChangs)}icon.png`,
    logo: `${getCardImageDirectory(CardName.pfChangs)}logo.png`,
    logoBackgroundColor: '#AA272F',
    name: CardName.pfChangs,
    website: 'pfchangs.com'
  },
  {
    brand: CardBrand.potteryBarn,
    defaultClaimCodeType: ClaimCodeType.barcode,
    emailRequired: false,
    logoBackgroundColor: '#1E355E',
    name: CardName.potteryBarn,
    website: 'potterybarn.com'
  },
  {
    brand: CardBrand.royalCaribbean,
    defaultClaimCodeType: ClaimCodeType.link,
    emailRequired: false,
    logoBackgroundColor: '#0668A4',
    name: CardName.royalCaribbean,
    website: 'royalcaribbean.com'
  },
  {
    brand: CardBrand.sonyPlayStation,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    icon: `${getCardImageDirectory(CardName.sonyPlayStation)}icon.png`,
    logo: `${getCardImageDirectory(CardName.sonyPlayStation)}logo.png`,
    logoBackgroundColor: '#1466B2',
    name: CardName.sonyPlayStation,
    website: 'playstation.com'
  },
  {
    brand: CardBrand.spotify,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    logoBackgroundColor: '#26CE7B',
    name: CardName.spotify,
    website: 'spotify.com'
  },
  {
    brand: CardBrand.uber,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    logoBackgroundColor: '#000000',
    name: CardName.uber,
    website: 'uber.com'
  },
  {
    brand: CardBrand.uberEats,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    logoBackgroundColor: '#000000',
    name: CardName.uberEats,
    website: 'uber.com'
  },
  {
    brand: CardBrand.xboxLive,
    defaultClaimCodeType: ClaimCodeType.code,
    emailRequired: false,
    icon: `${getCardImageDirectory(CardName.xboxLive)}icon.png`,
    // logo: `${getCardImageDirectory(CardName.sonyPlayStation)}logo.png`,
    logoBackgroundColor: 'linear-gradient(-90deg, #25B325 11%, #107C10 100%);',
    name: CardName.xboxLive,
    website: 'xbox.com'
  }
] as BaseCardConfig[]).map(c => ({
  ...c,
  cardImage: c.cardImage || `${getCardImageDirectory(c.name)}card.png`,
  icon: c.icon || `${getCardImageDirectory(c.name)}icon.svg`,
  logo: c.logo || `${getCardImageDirectory(c.name)}logo.svg`
}));

function getCardImageDirectory(cardName: CardName) {
  const cardImagePath = 'assets/img/gift-cards/';
  return `${cardImagePath}${cardName
    .toLowerCase()
    .replace(/[^0-9a-z]/gi, '')}/`;
}
