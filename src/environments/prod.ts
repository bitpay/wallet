import { EnvironmentSchema } from './schema';

/**
 * Environment: prod
 */
const env: EnvironmentSchema = {
  name: 'production',
  enableAnimations: true,
  ratesAPI: {
    btc: 'https://bitpay.com/api/rates',
    bch: 'https://bitpay.com/api/rates/bch',
    eth: 'https://bitpay.com/api/rates/eth',
    usdc: 'https://bitpay.com/api/rates/usdc',
    pax: 'https://bitpay.com/api/rates/pax',
    gusd: 'https://bitpay.com/api/rates/gusd'
  },
  activateScanner: true
};

export default env;
