/**
 * Security utilities for input sanitization and escaping
 * Prevents XSS, SQL injection, and other attack vectors
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * Converts: < > & " ' into their HTML entity equivalents
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitize text input by removing dangerous characters AND escaping HTML
 * Use for user-generated content that will be displayed
 * Combines sanitization and HTML escaping for defense-in-depth
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Remove null bytes
  let sanitized = text.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent memory exhaustion attacks
  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000);
  }
  
  // Escape HTML to prevent XSS (defense-in-depth)
  sanitized = escapeHtml(sanitized);
  
  return sanitized;
}

/**
 * Validate and sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return null;
    }
  }
  
  // Only allow http, https, and relative URLs
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('/')) {
    console.warn(`Blocked non-HTTP URL: ${trimmed}`);
    return null;
  }
  
  return trimmed;
}

/**
 * Sanitize filename to prevent directory traversal attacks
 */
export function sanitizeFilename(filename: string | null | undefined): string {
  if (!filename) return '';
  
  // Remove path separators and dangerous characters
  let sanitized = filename.replace(/[\/\\\.\.]/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  return sanitized;
}

/**
 * Sanitize array of strings (e.g., tags)
 */
export function sanitizeStringArray(items: string[] | null | undefined): string[] {
  if (!items || !Array.isArray(items)) return [];
  
  return items
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0)
    .slice(0, 100); // Limit array size
}
