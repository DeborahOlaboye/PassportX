
import { EnvValidator } from '../utils/envValidation';

/**
 * Validate the most critical environment variables needed for the server
 * to start. Called before any services are initialised.
 *
 * Throws (via process.exit) if any required variable is missing or still
 * set to a known insecure placeholder.
 */
export function validateRequiredEnv(): void {
  const critical = ['MONGODB_URI', 'JWT_SECRET'];

  const missing = critical.filter(
    (v) =>
      !process.env[v] ||
      process.env[v] === 'your-super-secret-jwt-key-change-in-production' ||
      process.env[v] === 'default-secret'
  );

  if (missing.length > 0) {
    console.error(
      `❌ [env] Missing or insecure required environment variables: ${missing.join(', ')}`
    );
    console.error('❌ [env] Copy backend/.env.example to backend/.env and fill in the values.');
    process.exit(1);
  }
}

export function registerRequiredEnvVars(): void {
  // Webhook Secrets
  EnvValidator.addRequiredVariable('BADGE_METADATA_WEBHOOK_SECRET');
  EnvValidator.addRequiredVariable('BADGE_REVOCATION_WEBHOOK_SECRET');

  // General Webhook Validation
  if (process.env.WEBHOOK_SIGNATURE_VALIDATION === 'true') {
    EnvValidator.addRequiredVariable('WEBHOOK_SECRET_KEY');
  }
}
