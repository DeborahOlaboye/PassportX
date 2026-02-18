
import { EnvValidator } from '../utils/envValidation';

export function registerRequiredEnvVars(): void {
  // Webhook Secrets
  EnvValidator.addRequiredVariable('BADGE_METADATA_WEBHOOK_SECRET');
  EnvValidator.addRequiredVariable('BADGE_REVOCATION_WEBHOOK_SECRET');

  // General Webhook Validation
  if (process.env.WEBHOOK_SIGNATURE_VALIDATION === 'true') {
    EnvValidator.addRequiredVariable('WEBHOOK_SECRET_KEY');
  }
}
