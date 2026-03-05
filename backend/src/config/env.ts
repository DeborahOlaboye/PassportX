/**
 * Environment variable validation for the PassportX backend.
 *
 * Call validateRequiredEnv() once at startup (before any service is
 * initialised) so that missing secrets are reported immediately rather
 * than causing subtle runtime failures.
 */

const REQUIRED_VARS = [
  'JWT_SECRET',
  'MONGODB_URI',
] as const;

/**
 * Throws an aggregated error listing every missing required variable so
 * the operator can fix them all in one restart cycle.
 */
export function validateRequiredEnv(): void {
  const missing = REQUIRED_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n` +
      'Set them in your .env file or deployment environment before starting the server.'
    );
  }

  // Extra guard: JWT_SECRET must not be a well-known default placeholder
  const jwtSecret = process.env.JWT_SECRET!;
  const insecurePlaceholders = [
    'your-secret-key',
    'default-secret-key',
    'secret',
    'changeme',
    'your-super-secret-jwt-key-change-in-production',
  ];

  if (insecurePlaceholders.some(p => jwtSecret.toLowerCase().includes(p.toLowerCase()))) {
    throw new Error(
      'JWT_SECRET appears to be a placeholder value. ' +
      'Replace it with a strong, randomly-generated secret before starting in production.'
    );
  }
}
