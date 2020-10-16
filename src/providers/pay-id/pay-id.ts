export interface PayIdAddress {
  paymentNetwork: string;
  environment: string;
  addressDetailsType: string;
  addressDetails: { address: string };
}

export interface PayIdDetails {
  payId: string;
  version: string;
  addresses: PayIdAddress[];
}

export function isPayId(value: string): boolean {
  return (
    value.includes('$') &&
    !value.startsWith('$') &&
    !value.includes('https://') &&
    value.endsWith('ematiu.sandbox.payid.org')
  );
}

export function getPayIdUrl(payId: string): string {
  const parts = payId.split('$');
  return `https://${parts[1]}/${parts[0]}`;
}

export function getAddressFromPayId(
  payIdDetails: PayIdDetails,
  params: {
    coin: string;
    network: string;
  }
): string | undefined {
  const address = payIdDetails.addresses.find(
    address =>
      address.paymentNetwork === params.coin.toUpperCase() &&
      address.environment === params.network.toUpperCase()
  );
  return address && address.addressDetails.address;
}
