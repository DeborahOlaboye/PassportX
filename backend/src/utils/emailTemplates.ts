/**
 * Minimal HTML email template helpers used by notification services.
 * Keeps email HTML consistent and avoids repetition across services.
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#ea580c',
  critical: '#dc2626',
};

/** Wrap content in a simple, mail-client-safe HTML shell. */
export function htmlEmail(opts: {
  title: string;
  body: string;
  severity?: AlertSeverity;
}): string {
  const color =
    opts.severity != null ? SEVERITY_COLOR[opts.severity] : '#1e40af';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;
                      box-shadow:0 1px 3px rgba(0,0,0,.1)">
          <tr>
            <td style="background:${color};padding:20px 24px">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">
                ${escapeHtml(opts.title)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:#374151;font-size:14px;line-height:1.6">
              ${opts.body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f9fafb;
                       color:#9ca3af;font-size:12px;text-align:center">
              PassportX &mdash; automated notification
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Build a two-column key/value detail table row. */
export function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 8px;font-weight:600;white-space:nowrap;
               vertical-align:top;color:#6b7280">${escapeHtml(label)}</td>
    <td style="padding:4px 8px;font-family:monospace;word-break:break-all">
      ${escapeHtml(value)}
    </td>
  </tr>`;
}

/** Escape HTML special chars to prevent injection in template strings. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
