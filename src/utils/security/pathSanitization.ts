/**
 * Path Sanitization Utility
 *
 * Provides comprehensive path sanitization to prevent path traversal attacks.
 * This implementation follows OWASP security best practices for file path validation.
 *
 * Security features:
 * - Blocks all path traversal attempts (including encoded variants)
 * - Enforces root directory boundary
 * - Detects null byte injection
 * - Identifies suspicious patterns
 * - Validates symlink targets
 */

import * as path from 'path';
import * as fs from 'fs';

export class PathSanitizer {
  private rootDirectory: string;

  constructor(rootDirectory: string) {
    // Normalize and resolve the root directory to absolute path
    this.rootDirectory = path.resolve(rootDirectory);
  }

  /**
   * Sanitizes a path and ensures it stays within the root boundary.
   * Prevents path traversal attacks through multiple mechanisms.
   *
   * @param inputPath - The path to sanitize (can be relative or absolute)
   * @returns Sanitized absolute path within root boundary
   * @throws Error if path is malicious or outside root boundary
   */
  sanitize(inputPath: string): string {
    // 1. Check for null bytes (can bypass some security checks)
    if (inputPath.includes('\0')) {
      throw new Error('Null bytes are not allowed in paths');
    }

    // 2. Decode URI components to catch encoded traversal attempts
    let decodedPath = inputPath;
    try {
      decodedPath = decodeURIComponent(inputPath);
    } catch {
      throw new Error('Invalid URI encoding in path');
    }

    // 3. Check for various path traversal patterns
    const traversalPatterns = [
      /\.\./,           // Standard ..
      /%2e%2e/i,        // URL encoded ..
      /\.\./g,          // Multiple ..
      /\.%2e/i,         // Mixed encoding
      /%2e\./i,         // Mixed encoding reverse
      /0x2e0x2e/i,      // Hex encoded
    ];

    for (const pattern of traversalPatterns) {
      if (pattern.test(decodedPath)) {
        throw new Error(`Path traversal attempt detected: ${pattern}`);
      }
    }

    // 4. Normalize the path (resolve . and .. in a safe way)
    const normalizedPath = path.normalize(decodedPath);

    // 5. Join with root directory and resolve to absolute path
    const absolutePath = path.resolve(this.rootDirectory, normalizedPath);

    // 6. Verify the resolved path is within root boundary
    if (!this.isWithinRoot(absolutePath)) {
      throw new Error(
        `Path "${inputPath}" resolves outside root boundary: ${this.rootDirectory}`
      );
    }

    // 7. Additional checks for suspicious patterns
    this.checkSuspiciousPatterns(absolutePath);

    return absolutePath;
  }

  /**
   * Verifies that the resolved path is within the root directory boundary.
   *
   * @param absolutePath - The absolute path to check
   * @returns true if path is within root, false otherwise
   */
  private isWithinRoot(absolutePath: string): boolean {
    // Get the relative path from root to target
    const relativePath = path.relative(this.rootDirectory, absolutePath);

    // If relative path starts with .. or is absolute, it's outside root
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  }

  /**
   * Checks for additional suspicious patterns that might indicate attacks.
   *
   * @param absolutePath - The absolute path to check
   * @throws Error if suspicious pattern is detected
   */
  private checkSuspiciousPatterns(absolutePath: string): void {
    const suspiciousPatterns = [
      /\/etc\/passwd/i,
      /\/etc\/shadow/i,
      /\\windows\\system32/i,
      /\.ssh/i,
      /\.env/i,
      /id_rsa/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(absolutePath)) {
        throw new Error(`Suspicious path pattern detected: ${pattern}`);
      }
    }
  }

  /**
   * Validates that a path exists and is within root (for existing files).
   * Also resolves and validates symlinks.
   *
   * @param inputPath - The path to validate
   * @returns The real absolute path after resolving symlinks
   * @throws Error if path doesn't exist, is outside root, or symlink is malicious
   */
  async validateExistingPath(inputPath: string): Promise<string> {
    const sanitizedPath = this.sanitize(inputPath);

    try {
      // Check if path exists
      await fs.promises.access(sanitizedPath, fs.constants.R_OK);

      // Resolve symlinks and verify again
      const realPath = await fs.promises.realpath(sanitizedPath);

      if (!this.isWithinRoot(realPath)) {
        throw new Error('Symlink points outside root boundary');
      }

      return realPath;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Path does not exist: ${inputPath}`);
      }
      throw error;
    }
  }

  /**
   * Checks if a path would be valid without requiring it to exist.
   *
   * @param inputPath - The path to check
   * @returns true if path is valid, false otherwise
   */
  isValidPath(inputPath: string): boolean {
    try {
      this.sanitize(inputPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the root directory for this sanitizer.
   *
   * @returns The absolute root directory path
   */
  getRoot(): string {
    return this.rootDirectory;
  }
}

/**
 * Example usage:
 *
 * const sanitizer = new PathSanitizer('/safe/root/directory');
 * try {
 *   const safePath = sanitizer.sanitize(userInput);
 *   // Use safePath for file operations
 * } catch (error) {
 *   // Handle security violation
 *   console.error('Security violation:', error.message);
 * }
 */
