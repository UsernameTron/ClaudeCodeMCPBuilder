/**
 * XSS Prevention Utility
 *
 * Provides comprehensive Cross-Site Scripting (XSS) prevention following OWASP guidelines.
 * Implements multiple sanitization strategies for different contexts.
 *
 * Security features:
 * - HTML escaping for text content
 * - HTML sanitization with whitelist approach
 * - Event handler removal
 * - Protocol filtering (javascript:, data:, vbscript:)
 * - URL sanitization
 * - JSON context escaping
 * - Context-specific validation
 * - Content Security Policy generation
 */

export class XSSPrevention {
  /**
   * Escapes HTML special characters to prevent XSS.
   * Use this for user-generated content that should be displayed as text.
   *
   * This is the RECOMMENDED method for most use cases where you want to display
   * user input as plain text in HTML context.
   *
   * @param input - The string to escape
   * @returns The escaped string safe for HTML context
   *
   * @example
   * const userInput = '<script>alert("XSS")</script>';
   * const safe = XSSPrevention.escapeHTML(userInput);
   * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
   */
  static escapeHTML(input: string): string {
    const htmlEscapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
  }

  /**
   * Sanitizes HTML to prevent XSS attacks.
   * Uses a whitelist approach - only allows safe tags and attributes.
   *
   * This should be used when you need to allow SOME HTML formatting but want
   * to block dangerous tags and attributes.
   *
   * @param input - The HTML string to sanitize
   * @returns Sanitized HTML with only safe tags and no dangerous attributes
   *
   * @example
   * const userHTML = '<strong>Hello</strong><script>alert(1)</script>';
   * const safe = XSSPrevention.sanitizeHTML(userHTML);
   * // Returns: '<strong>Hello</strong>'
   */
  static sanitizeHTML(input: string): string {
    // Whitelist of safe tags (minimal set for text formatting)
    const allowedTags = ['b', 'i', 'em', 'strong', 'code', 'pre'];
    const allowedTagsPattern = allowedTags.join('|');

    // Remove all tags except allowed ones
    let sanitized = input.replace(
      new RegExp(`<(?!\/?(${allowedTagsPattern})\\b)[^>]*>`, 'gi'),
      ''
    );

    // Remove event handlers and javascript: protocols from remaining tags
    sanitized = this.removeEventHandlers(sanitized);
    sanitized = this.removeJavaScriptProtocols(sanitized);

    return sanitized;
  }

  /**
   * Removes event handlers from HTML attributes.
   * This catches onclick, onload, onerror, and many other event handlers.
   *
   * @param input - HTML string that may contain event handlers
   * @returns HTML with all event handlers removed
   */
  private static removeEventHandlers(input: string): string {
    const eventHandlers = [
      'onclick',
      'onload',
      'onerror',
      'onmouseover',
      'onmouseout',
      'onmousemove',
      'onmousedown',
      'onmouseup',
      'onfocus',
      'onblur',
      'onchange',
      'onsubmit',
      'onkeydown',
      'onkeyup',
      'onkeypress',
      'ondblclick',
      'oncontextmenu',
      'oninput',
      'onscroll',
      'ondrag',
      'ondrop',
      'oncopy',
      'oncut',
      'onpaste',
      'onabort',
      'oncanplay',
      'oncanplaythrough',
      'ondurationchange',
      'onemptied',
      'onended',
      'onloadeddata',
      'onloadedmetadata',
      'onloadstart',
      'onpause',
      'onplay',
      'onplaying',
      'onprogress',
      'onratechange',
      'onseeked',
      'onseeking',
      'onstalled',
      'onsuspend',
      'ontimeupdate',
      'onvolumechange',
      'onwaiting',
    ];

    let sanitized = input;
    for (const handler of eventHandlers) {
      // Match: onclick="..." or onclick='...' or onclick=...
      const pattern = new RegExp(`\\s*${handler}\\s*=\\s*["'][^"']*["']`, 'gi');
      sanitized = sanitized.replace(pattern, '');

      // Also match unquoted event handlers
      const unquotedPattern = new RegExp(`\\s*${handler}\\s*=\\s*[^\\s>]*`, 'gi');
      sanitized = sanitized.replace(unquotedPattern, '');
    }

    return sanitized;
  }

  /**
   * Removes javascript:, data:, and vbscript: protocols from attributes.
   * These can be used in href, src, and other attributes to execute JavaScript.
   *
   * @param input - HTML string that may contain dangerous protocols
   * @returns HTML with dangerous protocols removed
   */
  private static removeJavaScriptProtocols(input: string): string {
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    let sanitized = input;

    for (const protocol of dangerousProtocols) {
      // Case-insensitive replacement
      const pattern = new RegExp(protocol, 'gi');
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  /**
   * Sanitizes a URL to prevent XSS through href attributes.
   * Uses a whitelist of safe protocols.
   *
   * @param url - The URL to sanitize
   * @returns Sanitized URL or empty string if unsafe
   *
   * @example
   * XSSPrevention.sanitizeURL('https://example.com'); // OK
   * XSSPrevention.sanitizeURL('javascript:alert(1)'); // Returns ''
   */
  static sanitizeURL(url: string): string {
    // Whitelist of safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

    try {
      const parsedURL = new URL(url);

      if (!safeProtocols.includes(parsedURL.protocol)) {
        throw new Error(`Unsafe protocol: ${parsedURL.protocol}`);
      }

      return parsedURL.toString();
    } catch {
      // If URL parsing fails, it's not a valid URL - return empty string
      return '';
    }
  }

  /**
   * Sanitizes user input for use in JSON context to prevent XSS.
   * Escapes characters that could break out of JSON strings or be interpreted as HTML.
   *
   * @param input - The string to sanitize for JSON context
   * @returns JSON-safe string
   *
   * @example
   * const userInput = '</script><script>alert(1)</script>';
   * const safe = XSSPrevention.sanitizeJSON(userInput);
   * const json = `{"message": "${safe}"}`;
   */
  static sanitizeJSON(input: string): string {
    // Escape characters that could break out of JSON context
    return input
      .replace(/\\/g, '\\\\') // Backslash must be first
      .replace(/"/g, '\\"') // Escape quotes
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t') // Escape tabs
      .replace(/</g, '\\u003c') // Escape < to prevent </script>
      .replace(/>/g, '\\u003e'); // Escape > for completeness
  }

  /**
   * Creates a Content Security Policy header value.
   * This provides defense-in-depth by telling the browser what content is allowed.
   *
   * @returns CSP header value string
   *
   * @example
   * const csp = XSSPrevention.generateCSP();
   * response.setHeader('Content-Security-Policy', csp);
   */
  static generateCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for some frameworks
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'", // Prevent clickjacking
      "base-uri 'self'", // Prevent base tag injection
      "form-action 'self'", // Restrict form submissions
    ].join('; ');
  }

  /**
   * Validates that a string contains only safe characters for a specific context.
   * Use this for additional validation before processing user input.
   *
   * @param input - The string to validate
   * @param context - The context where this string will be used
   * @returns true if string is safe for the given context
   *
   * @example
   * XSSPrevention.isSafeForContext('myFile.txt', 'filename'); // true
   * XSSPrevention.isSafeForContext('../etc/passwd', 'filename'); // false
   */
  static isSafeForContext(
    input: string,
    context: 'alphanumeric' | 'filename' | 'identifier'
  ): boolean {
    const patterns = {
      alphanumeric: /^[a-zA-Z0-9\s]+$/,
      filename: /^[a-zA-Z0-9._-]+$/,
      identifier: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    };

    return patterns[context].test(input);
  }

  /**
   * Strips all HTML tags from a string.
   * More aggressive than sanitizeHTML - removes ALL tags.
   *
   * @param input - HTML string
   * @returns Plain text with all HTML removed
   *
   * @example
   * XSSPrevention.stripAllHTML('<p>Hello</p>'); // Returns: 'Hello'
   */
  static stripAllHTML(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * Validates and sanitizes input for use in HTML attributes.
   * Escapes quotes and angle brackets that could break out of attribute context.
   *
   * @param input - String to use in HTML attribute
   * @returns Sanitized string safe for HTML attribute
   *
   * @example
   * const title = XSSPrevention.sanitizeAttribute(userInput);
   * const html = `<div title="${title}">Content</div>`;
   */
  static sanitizeAttribute(input: string): string {
    return input
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
