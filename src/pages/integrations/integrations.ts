export function setPrice(isFiat: boolean, amount: number) {
  return {
    fiat: isFiat ? amount : undefined,
    qty: isFiat ? undefined : amount
  };
}

export interface Price {
  qty?: number;
  amount?: number;
}
