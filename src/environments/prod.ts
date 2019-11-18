import { CurrencyProvider } from '../providers/currency/currency';
import { EnvironmentSchema } from './schema';

/**
 * Environment: prod
 */
const env: EnvironmentSchema = {
  name: 'production',
  enableAnimations: true,
  ratesAPI: new CurrencyProvider().getRatesApi(),
  activateScanner: true
};

export default env;
