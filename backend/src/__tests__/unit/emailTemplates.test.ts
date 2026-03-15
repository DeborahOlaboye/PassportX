import {
  htmlEmail,
  detailRow,
  escapeHtml,
  AlertSeverity,
} from '../../utils/emailTemplates';

describe('emailTemplates', () => {
  describe('escapeHtml()', () => {
    it('escapes ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('escapes angle brackets', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes double quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    });

    it('escapes single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#39;s');
    });

    it('returns plain text unchanged', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('detailRow()', () => {
    it('contains the label and value', () => {
      const row = detailRow('Severity', 'high');
      expect(row).toContain('Severity');
      expect(row).toContain('high');
    });

    it('escapes HTML in the value', () => {
      const row = detailRow('Key', '<script>alert(1)</script>');
      expect(row).not.toContain('<script>');
      expect(row).toContain('&lt;script&gt;');
    });
  });

  describe('htmlEmail()', () => {
    const severities: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];

    it('includes the title in the output', () => {
      const html = htmlEmail({ title: 'Test Alert', body: '<p>body</p>' });
      expect(html).toContain('Test Alert');
    });

    it('includes the body in the output', () => {
      const html = htmlEmail({ title: 'T', body: '<p>custom content</p>' });
      expect(html).toContain('<p>custom content</p>');
    });

    it('escapes the title to prevent XSS', () => {
      const html = htmlEmail({
        title: '<img src=x onerror=alert(1)>',
        body: 'safe',
      });
      expect(html).not.toContain('<img src=x');
      expect(html).toContain('&lt;img');
    });

    it.each(severities)(
      'renders a non-empty HTML document for severity "%s"',
      (sev) => {
        const html = htmlEmail({ title: 'Alert', body: 'msg', severity: sev });
        expect(html).toContain('<!DOCTYPE html>');
        expect(html.length).toBeGreaterThan(200);
      }
    );

    it('uses a default color when no severity is provided', () => {
      const html = htmlEmail({ title: 'Info', body: 'msg' });
      expect(html).toContain('#1e40af');
    });
  });
});
