export interface SanitizationConfig {
  maxLength: number;
  stripHtml: boolean;
  allowLists: string[];
  blockPatterns: RegExp[];
}

const defaultConfig: SanitizationConfig = {
  maxLength: 10000,
  stripHtml: true,
  allowLists: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
  blockPatterns: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ],
};

export class InputSanitizer {
  private config: SanitizationConfig;

  constructor(config: Partial<SanitizationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';

    let sanitized = input.slice(0, this.config.maxLength);

    if (this.config.stripHtml) {
      sanitized = this.stripHtmlTags(sanitized);
    }

    sanitized = this.removeBlockedPatterns(sanitized);

    return sanitized.trim();
  }

  sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : '';
  }

  sanitizeUrl(url: string): string {
    const sanitized = this.sanitizeString(url);
    try {
      const parsed = new URL(sanitized, 'http://localhost');
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return sanitized;
      }
    } catch {}
    return '';
  }

  sanitizeHtml(html: string): string {
    let sanitized = html.slice(0, this.config.maxLength);

    for (const pattern of this.config.blockPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  private stripHtmlTags(input: string): string {
    if (typeof document !== 'undefined') {
      const temp = document.createElement('div');
      temp.textContent = input;
      return temp.innerHTML;
    }
    return input.replace(/<[^>]*>/g, '');
  }

  private removeBlockedPatterns(input: string): string {
    let result = input;
    for (const pattern of this.config.blockPatterns) {
      result = result.replace(pattern, '');
    }
    return result;
  }

  sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized as T;
  }
}

export const createSanitizer = (
  config?: Partial<SanitizationConfig>
): InputSanitizer => {
  return new InputSanitizer(config);
};

export const defaultSanitizer = createSanitizer();

export const sanitizeInput = (input: string): string => {
  return defaultSanitizer.sanitizeString(input);
};

export const sanitizeEmail = (email: string): string => {
  return defaultSanitizer.sanitizeEmail(email);
};

export const sanitizeUrl = (url: string): string => {
  return defaultSanitizer.sanitizeUrl(url);
};
