import production from './prod';
import { EnvironmentSchema } from './schema';

const env: EnvironmentSchema = {
  // Start with production config,
  ...production,
  // override for development:
  name: 'development'
};

export default env;
