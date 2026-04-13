import { InputSanitizer } from '../InputSanitizer';

describe('InputSanitizer', () => {
  let sanitizer: InputSanitizer;

  beforeEach(() => {
    sanitizer = new InputSanitizer({ maxLength: 100, stripHtml: true });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizer.sanitizeString('  hello  ')).toBe('hello');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(200);
      expect(sanitizer.sanitizeString(longString).length).toBe(100);
    });

    it('should strip HTML tags', () => {
      expect(sanitizer.sanitizeString('<script>alert(1)</script>test')).toBe(
        'test'
      );
    });

    it('should remove javascript: URLs', () => {
      expect(sanitizer.sanitizeString('javascript:alert(1)')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should validate correct email', () => {
      expect(sanitizer.sanitizeEmail('test@example.com')).toBe(
        'test@example.com'
      );
    });

    it('should reject invalid email', () => {
      expect(sanitizer.sanitizeEmail('invalid')).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow http URLs', () => {
      expect(sanitizer.sanitizeUrl('http://example.com')).toBe(
        'http://example.com'
      );
    });

    it('should allow https URLs', () => {
      expect(sanitizer.sanitizeUrl('https://example.com')).toBe(
        'https://example.com'
      );
    });

    it('should reject invalid URLs', () => {
      expect(sanitizer.sanitizeUrl('javascript:alert(1)')).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values', () => {
      const obj = { name: '  <script>test</script>', age: 25 };
      const result = sanitizer.sanitizeObject(obj);
      expect(result.name).toBe('test');
      expect(result.age).toBe(25);
    });
  });
});
