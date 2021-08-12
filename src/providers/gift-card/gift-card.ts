import {
  CardConfig,
  CardConfigMap,
  GiftCard,
  GiftCardDiscount,
  GiftCardPromotion,
} from './gift-card.types';

export function getActivationFee(
  amount: number,
  cardConfig: CardConfig
): number {
  const activationFees = (cardConfig && cardConfig.activationFees) || [];
  const fixedFee = activationFees.find(
    fee =>
      fee.type === 'fixed' &&
      amount >= fee.amountRange.min &&
      amount <= fee.amountRange.max
  );
  return (fixedFee && fixedFee.fee) || 0;
}

export function filterDisplayableConfig(cardConfig: CardConfig) {
  return (
    cardConfig.logo &&
    cardConfig.icon &&
    cardConfig.cardImage &&
    !cardConfig.hidden
  );
}

export function sortByDescendingDate(a: GiftCard, b: GiftCard) {
  return a.date < b.date ? 1 : -1;
}

export function sortByDisplayName(
  a: { displayName: string },
  b: { displayName: string }
) {
  const aSortValue = getDisplayNameSortValue(a.displayName);
  const bSortValue = getDisplayNameSortValue(b.displayName);
  return aSortValue > bSortValue ? 1 : -1;
}

export function getDisplayNameSortValue(displayName: string) {
  const startsNumeric = value => /^[0-9]$/.test(value.charAt(0));
  const name = displayName.toLowerCase();
  return `${startsNumeric(name) ? 'zzz' : ''}${name}`;
}

export function setNullableCardFields(card: GiftCard, cardConfig: CardConfig) {
  return {
    ...card,
    name: cardConfig.name,
    displayName: cardConfig.displayName,
    currency: card.currency || getCurrencyFromLegacySavedCard(cardConfig.name)
  };
}

export function getCardsFromInvoiceMap(
  invoiceMap: {
    [invoiceId: string]: GiftCard;
  },
  configMap: CardConfigMap
): GiftCard[] {
  return Object.keys(invoiceMap)
    .map(invoiceId => invoiceMap[invoiceId] as GiftCard)
    .filter(card => card.invoiceId && configMap[card.name])
    .map(card => setNullableCardFields(card, configMap[card.name]))
    .sort(sortByDescendingDate);
}

export function hasVisibleDiscount(cardConfig: CardConfig) {
  return !!getVisibleDiscount(cardConfig);
}

export function hasPromotion(cardConfig: CardConfig) {
  return !!(cardConfig.promotions && cardConfig.promotions[0]);
}

export function getPromo(
  cardConfig: CardConfig
): GiftCardDiscount | GiftCardPromotion {
  return (
    getVisibleDiscount(cardConfig) ||
    (cardConfig.promotions && cardConfig.promotions[0])
  );
}

export function getVisibleDiscount(cardConfig: CardConfig) {
  const discounts = cardConfig.discounts;
  const supportedDiscountTypes = ['flatrate', 'percentage'];
  return (
    discounts &&
    discounts.find(d => supportedDiscountTypes.includes(d.type) && !d.hidden)
  );
}

function getCurrencyFromLegacySavedCard(
  cardName: string
): 'USD' | 'JPY' | 'BRL' {
  switch (cardName) {
    case 'Amazon.com':
      return 'USD';
    case 'Amazon.co.jp':
      return 'JPY';
    case 'Mercado Livre':
      return 'BRL';
    default:
      return 'USD';
  }
}
