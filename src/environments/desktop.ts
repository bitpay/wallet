import production from './prod';
import { EnvironmentSchema } from './schema';

/**
 * Environment: prod
 */
const env: EnvironmentSchema = {
  // Start with production config,
  ...production,
  // override for desktop:
  enableAnimations: false
};

export default env;
