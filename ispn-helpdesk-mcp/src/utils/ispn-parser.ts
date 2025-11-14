/**
 * ISPN Response Parser
 *
 * Parses ISPN Helpdesk API responses which come in two formats:
 * 1. Plain text: "1; OK; Customer 4256378 created"
 * 2. XML: <customer><billid>999</billid>...</customer>
 */

export interface ISPNTextResponse {
  success: boolean;
  code: number;
  message: string;
  data?: string;
}

/**
 * Parse ISPN plain text response
 *
 * Success format: "1; OK; [optional message]"
 * Failure format: "0; [error message]"
 *
 * @param response - Raw text response from ISPN API
 * @returns Parsed response object
 */
export function parseTextResponse(response: string): ISPNTextResponse {
  const trimmed = response.trim();

  // Split by semicolon
  const parts = trimmed.split(';').map(p => p.trim());

  if (parts.length < 2) {
    return {
      success: false,
      code: 0,
      message: 'Invalid response format',
      data: response
    };
  }

  const code = parseInt(parts[0], 10);
  const success = code === 1;
  const message = parts.slice(1).join('; ');

  return {
    success,
    code,
    message,
    data: parts.length > 2 ? parts.slice(2).join('; ') : undefined
  };
}

/**
 * Parse ISPN XML response
 *
 * Simple XML parser for ISPN responses. Uses basic regex matching
 * since ISPN XML is relatively simple and predictable.
 *
 * @param xmlString - Raw XML response from ISPN API
 * @returns Parsed object
 */
export function parseXMLResponse(xmlString: string): any {
  // Simple XML to JSON converter for ISPN responses
  const result: any = {};

  // Handle array-like structures (e.g., <ticketlist><ticket>...</ticket></ticketlist>)
  const listMatch = xmlString.match(/<(\w+)list>([\s\S]*)<\/\1list>/);
  if (listMatch) {
    const listName = listMatch[1]; // e.g., "ticket", "customer"
    const listContent = listMatch[2];

    // Extract all items
    const itemRegex = new RegExp(`<${listName}>(.*?)<\/${listName}>`, 'gs');
    const items = [];
    let match;

    while ((match = itemRegex.exec(listContent)) !== null) {
      items.push(parseXMLObject(match[1]));
    }

    result[`${listName}s`] = items;
    return result;
  }

  // Handle single object structures
  return parseXMLObject(xmlString);
}

/**
 * Parse a single XML object into a plain object
 */
function parseXMLObject(xmlString: string): any {
  const obj: any = {};

  // Extract simple tags: <tag>value</tag>
  const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
  let match;

  while ((match = tagRegex.exec(xmlString)) !== null) {
    const key = match[1];
    const value = match[2].trim();

    // Check if value contains nested XML
    if (value.includes('<')) {
      obj[key] = parseXMLObject(value);
    } else {
      obj[key] = value;
    }
  }

  return obj;
}

/**
 * Detect if response is XML or plain text
 */
export function isXMLResponse(response: string): boolean {
  const trimmed = response.trim();
  return trimmed.startsWith('<') && trimmed.includes('</');
}

/**
 * Parse ISPN response (auto-detect format)
 *
 * @param response - Raw response from ISPN API
 * @returns Parsed response
 */
export function parseISPNResponse(response: string): ISPNTextResponse | any {
  if (isXMLResponse(response)) {
    return parseXMLResponse(response);
  }
  return parseTextResponse(response);
}

/**
 * Extract ticket ID from "Ticket added; [ID]" response
 */
export function extractTicketId(response: string): string | null {
  const match = response.match(/Ticket added;\s*(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Extract customer ID from "Customer [ID] created" response
 */
export function extractCustomerId(response: string): string | null {
  const match = response.match(/Customer\s+(\d+)\s+created/i);
  return match ? match[1] : null;
}

/**
 * Check if response indicates success
 */
export function isSuccessResponse(response: string): boolean {
  if (isXMLResponse(response)) {
    return true; // XML responses are typically success
  }
  const parsed = parseTextResponse(response);
  return parsed.success;
}
