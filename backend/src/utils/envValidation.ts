
export interface EnvValidationResult {
  isValid: boolean;
  missingVariables: string[];
}

export class EnvValidator {
  private static requiredVariables: string[] = [];

  static addRequiredVariable(name: string): void {
    if (!this.requiredVariables.includes(name)) {
      this.requiredVariables.push(name);
    }
  }

  static validate(): EnvValidationResult {
    const missingVariables = this.requiredVariables.filter(
      (variable) => !process.env[variable] || process.env[variable] === 'default-secret'
    );

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  }

  static ensureValid(): void {
    const result = this.validate();
    if (!result.isValid) {
      const error = `Missing or insecure required environment variables: ${result.missingVariables.join(', ')}`;
      console.error(`❌ [EnvValidator] ${error}`);
      process.exit(1);
    }
  }
}
