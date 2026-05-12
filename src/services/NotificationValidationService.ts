export interface ValidationRule {
  name: string;
  validate: (data: Record<string, unknown>) => boolean;
  errorMessage: string;
}

class NotificationValidationService {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleName: string): void {
    this.rules = this.rules.filter((r) => r.name !== ruleName);
  }

  validate(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(data)) {
        errors.push(rule.errorMessage);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  clear(): void {
    this.rules = [];
  }
}

export const notificationValidationService = new NotificationValidationService();
