export interface AvailableCoin {
  coin: string;
}

export interface AvailableToken {
  symbol: string;
  chain: string;
}

export interface SupportedCoinsAndTokens {
  name: string;
  coin: string;
  chain: string;
  isToken: boolean;
}
