export interface EnvValidationResult {
  isValid: boolean;
  missingVariables: string[];
}

/** Placeholder values that indicate a variable was not properly configured */
const INSECURE_PLACEHOLDERS = [
  'default-secret',
  'your-super-secret-jwt-key-change-in-production',
  'change-me-to-something-strong-in-production',
  'your_project_id_here',
  'your-deployer-private-key',
];

export class EnvValidator {
  private static requiredVariables: string[] = [];

  static addRequiredVariable(name: string): void {
    if (!this.requiredVariables.includes(name)) {
      this.requiredVariables.push(name);
    }
  }

  static validate(): EnvValidationResult {
    const missingVariables = this.requiredVariables.filter((variable) => {
      const value = process.env[variable];
      return !value || INSECURE_PLACEHOLDERS.includes(value);
    });

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  }

  static ensureValid(): void {
    const result = this.validate();
    if (!result.isValid) {
      console.error(
        `❌ [EnvValidator] Missing or insecure required environment variables: ${result.missingVariables.join(
          ', '
        )}`
      );
      console.error(
        '❌ [EnvValidator] Copy backend/.env.example to backend/.env and set real values for each missing variable.'
      );
      process.exit(1);
    }
    console.log(
      `✅ [EnvValidator] All ${this.requiredVariables.length} required variables are present.`
    );
  }
}
