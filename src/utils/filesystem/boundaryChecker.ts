/**
 * File System Boundary Checker
 *
 * Enforces root directory boundaries for all file system operations.
 * Prevents path traversal and ensures operations stay within allowed directories.
 *
 * Security features:
 * - Multiple root directory support
 * - Automatic path validation
 * - Safe file read/write operations
 * - Directory traversal prevention
 * - Integration with PathSanitizer
 */

import * as path from 'path';
import * as fs from 'fs';
import { PathSanitizer } from '../security/pathSanitization';

export class FileSystemBoundaryChecker {
  private pathSanitizer: PathSanitizer;
  private allowedRoots: Set<string>;

  /**
   * Creates a new boundary checker with specified allowed root directories.
   *
   * @param rootDirectories - Array of allowed root directory paths
   * @throws Error if no root directories are specified
   *
   * @example
   * const checker = new FileSystemBoundaryChecker(['/var/lib/mcp-data']);
   * const safePath = checker.validatePath(userInput);
   */
  constructor(rootDirectories: string[]) {
    if (rootDirectories.length === 0) {
      throw new Error('At least one root directory must be specified');
    }

    // Normalize all root directories to absolute paths
    this.allowedRoots = new Set(rootDirectories.map((dir) => path.resolve(dir)));

    // Use the first root as the primary for PathSanitizer
    this.pathSanitizer = new PathSanitizer(rootDirectories[0]);
  }

  /**
   * Checks if a path is within any of the allowed root boundaries.
   * This is a read-only check that doesn't throw exceptions.
   *
   * @param targetPath - The path to check
   * @returns true if path is within an allowed boundary, false otherwise
   *
   * @example
   * if (checker.isWithinBoundary(userPath)) {
   *   // Safe to use
   * }
   */
  isWithinBoundary(targetPath: string): boolean {
    const absolutePath = path.resolve(targetPath);

    for (const root of this.allowedRoots) {
      const relativePath = path.relative(root, absolutePath);

      // Path is within boundary if it doesn't start with .. and isn't absolute
      if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validates and returns the absolute path if within boundary.
   * Throws error if path is outside all allowed boundaries.
   *
   * @param targetPath - The path to validate
   * @returns Absolute path if valid
   * @throws Error if path is outside all allowed boundaries
   *
   * @example
   * try {
   *   const safePath = checker.validatePath(userInput);
   *   // Use safePath for file operations
   * } catch (error) {
   *   console.error('Invalid path:', error.message);
   * }
   */
  validatePath(targetPath: string): string {
    const absolutePath = path.resolve(targetPath);

    if (!this.isWithinBoundary(absolutePath)) {
      const rootsList = Array.from(this.allowedRoots).join(', ');
      throw new Error(
        `Path "${targetPath}" is outside allowed boundaries: ${rootsList}`
      );
    }

    return absolutePath;
  }

  /**
   * Safe file read that enforces boundary checking.
   * Automatically validates path before reading.
   *
   * @param filePath - Path to the file to read
   * @returns File contents as UTF-8 string
   * @throws Error if path is outside boundary or file cannot be read
   *
   * @example
   * const content = await checker.readFile(userPath);
   */
  async readFile(filePath: string): Promise<string> {
    const safePath = this.validatePath(filePath);

    try {
      return await fs.promises.readFile(safePath, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to read file "${filePath}": ${(error as Error).message}`
      );
    }
  }

  /**
   * Safe file write that enforces boundary checking.
   * Automatically validates path and creates directories if needed.
   *
   * @param filePath - Path to the file to write
   * @param content - Content to write
   * @throws Error if path is outside boundary or file cannot be written
   *
   * @example
   * await checker.writeFile(userPath, 'file content');
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const safePath = this.validatePath(filePath);

    // Ensure directory exists
    const directory = path.dirname(safePath);
    await fs.promises.mkdir(directory, { recursive: true });

    try {
      await fs.promises.writeFile(safePath, content, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to write file "${filePath}": ${(error as Error).message}`
      );
    }
  }

  /**
   * Safe directory listing that enforces boundary checking.
   * Returns full paths for all entries, all validated within boundary.
   *
   * @param dirPath - Path to directory to list
   * @returns Array of full paths to directory entries
   * @throws Error if path is outside boundary or directory cannot be read
   *
   * @example
   * const files = await checker.listDirectory(userPath);
   * for (const file of files) {
   *   // All files are guaranteed to be within boundary
   * }
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    const safePath = this.validatePath(dirPath);

    try {
      const entries = await fs.promises.readdir(safePath);
      // Return full paths, all validated within boundary
      return entries.map((entry) => path.join(safePath, entry));
    } catch (error) {
      throw new Error(
        `Failed to list directory "${dirPath}": ${(error as Error).message}`
      );
    }
  }

  /**
   * Checks if a path exists and is within boundary.
   * Returns false for paths outside boundary or non-existent paths.
   *
   * @param targetPath - Path to check
   * @returns true if path exists and is within boundary
   *
   * @example
   * if (await checker.exists(userPath)) {
   *   const content = await checker.readFile(userPath);
   * }
   */
  async exists(targetPath: string): Promise<boolean> {
    try {
      const safePath = this.validatePath(targetPath);
      await fs.promises.access(safePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the closest root directory for a given path.
   * Useful for determining which root a path belongs to.
   *
   * @param targetPath - Path to check
   * @returns The closest root directory, or null if path is outside all roots
   *
   * @example
   * const root = checker.getClosestRoot(userPath);
   * if (root) {
   *   console.log(`Path is under root: ${root}`);
   * }
   */
  getClosestRoot(targetPath: string): string | null {
    const absolutePath = path.resolve(targetPath);

    for (const root of this.allowedRoots) {
      if (absolutePath.startsWith(root)) {
        return root;
      }
    }

    return null;
  }

  /**
   * Adds a new allowed root directory.
   * Can be used to dynamically expand allowed boundaries.
   *
   * @param rootDirectory - Root directory to add
   *
   * @example
   * checker.addRoot('/additional/allowed/path');
   */
  addRoot(rootDirectory: string): void {
    const absoluteRoot = path.resolve(rootDirectory);
    this.allowedRoots.add(absoluteRoot);
  }

  /**
   * Gets all allowed root directories.
   *
   * @returns Array of all allowed root directory paths
   *
   * @example
   * const roots = checker.getAllowedRoots();
   * console.log('Allowed roots:', roots);
   */
  getAllowedRoots(): string[] {
    return Array.from(this.allowedRoots);
  }

  /**
   * Removes a file within boundary.
   * Validates path before deletion.
   *
   * @param filePath - Path to file to delete
   * @throws Error if path is outside boundary or file cannot be deleted
   *
   * @example
   * await checker.deleteFile(userPath);
   */
  async deleteFile(filePath: string): Promise<void> {
    const safePath = this.validatePath(filePath);

    try {
      await fs.promises.unlink(safePath);
    } catch (error) {
      throw new Error(
        `Failed to delete file "${filePath}": ${(error as Error).message}`
      );
    }
  }

  /**
   * Gets file stats for a file within boundary.
   * Validates path before accessing stats.
   *
   * @param filePath - Path to file
   * @returns File stats object
   * @throws Error if path is outside boundary or stats cannot be read
   *
   * @example
   * const stats = await checker.getStats(userPath);
   * console.log('File size:', stats.size);
   */
  async getStats(filePath: string): Promise<fs.Stats> {
    const safePath = this.validatePath(filePath);

    try {
      return await fs.promises.stat(safePath);
    } catch (error) {
      throw new Error(
        `Failed to get stats for "${filePath}": ${(error as Error).message}`
      );
    }
  }
}
