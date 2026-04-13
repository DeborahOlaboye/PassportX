export interface ValidationRule {
  field: string;
  type:
    | 'required'
    | 'email'
    | 'url'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'custom';
  value?: unknown;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
}

export class FormValidator {
  private rules: ValidationRule[];

  constructor(rules: ValidationRule[] = []) {
    this.rules = rules;
  }

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  validate(data: Record<string, unknown>): ValidationResult {
    const errors: { field: string; message: string }[] = [];

    for (const rule of this.rules) {
      const value = data[rule.field];
      const error = this.validateField(rule, value);
      if (error) {
        errors.push({ field: rule.field, message: error });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateField(rule: ValidationRule, value: unknown): string | null {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return rule.message;
        }
        break;
      case 'email':
        if (value && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return rule.message;
          }
        }
        break;
      case 'url':
        if (value && typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            return rule.message;
          }
        }
        break;
      case 'minLength':
        if (
          typeof value === 'string' &&
          value.length < (rule.value as number)
        ) {
          return rule.message;
        }
        break;
      case 'maxLength':
        if (
          typeof value === 'string' &&
          value.length > (rule.value as number)
        ) {
          return rule.message;
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && rule.value instanceof RegExp) {
          if (!rule.value.test(value)) {
            return rule.message;
          }
        }
        break;
      case 'custom':
        if (rule.value && typeof rule.value === 'function') {
          if (!(rule.value as (value: unknown) => boolean)(value)) {
            return rule.message;
          }
        }
        break;
    }
    return null;
  }
}

export const createValidator = (rules: ValidationRule[]): FormValidator => {
  return new FormValidator(rules);
};

export const validateRequired = (value: unknown): boolean => {
  return value !== undefined && value !== null && value !== '';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const validateMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};
