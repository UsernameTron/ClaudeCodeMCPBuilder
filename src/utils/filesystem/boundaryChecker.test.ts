/**
 * File System Boundary Checker Tests
 *
 * Comprehensive test suite covering:
 * - Path validation within boundaries
 * - Path rejection outside boundaries
 * - File read/write operations
 * - Directory operations
 * - Multiple root support
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileSystemBoundaryChecker } from './boundaryChecker';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

describe('FileSystemBoundaryChecker', () => {
  let checker: FileSystemBoundaryChecker;
  let testRoot: string;

  beforeEach(async () => {
    // Create unique temp directory for each test
    testRoot = path.join(os.tmpdir(), 'mcp-boundary-test-' + Date.now());
    await fs.promises.mkdir(testRoot, { recursive: true });
    checker = new FileSystemBoundaryChecker([testRoot]);
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.promises.rm(testRoot, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create checker with single root', () => {
      expect(() => new FileSystemBoundaryChecker([testRoot])).not.toThrow();
    });

    it('should create checker with multiple roots', () => {
      const roots = [testRoot, path.join(os.tmpdir(), 'root2')];
      expect(() => new FileSystemBoundaryChecker(roots)).not.toThrow();
    });

    it('should throw if no roots provided', () => {
      expect(() => new FileSystemBoundaryChecker([])).toThrow(
        'At least one root directory must be specified'
      );
    });

    it('should normalize root paths', () => {
      const checker = new FileSystemBoundaryChecker([testRoot + '/']);
      const roots = checker.getAllowedRoots();
      expect(roots[0]).toBe(path.resolve(testRoot));
    });
  });

  describe('isWithinBoundary', () => {
    it('should allow paths within root', () => {
      const validPath = path.join(testRoot, 'file.txt');
      expect(checker.isWithinBoundary(validPath)).toBe(true);
    });

    it('should allow deeply nested paths', () => {
      const nestedPath = path.join(testRoot, 'a', 'b', 'c', 'd', 'file.txt');
      expect(checker.isWithinBoundary(nestedPath)).toBe(true);
    });

    it('should allow paths with . in them', () => {
      const validPath = path.join(testRoot, 'subdir', '.', 'file.txt');
      expect(checker.isWithinBoundary(validPath)).toBe(true);
    });

    it('should block paths outside root', () => {
      const invalidPath = path.join(testRoot, '..', 'outside.txt');
      expect(checker.isWithinBoundary(invalidPath)).toBe(false);
    });

    it('should block absolute paths outside root', () => {
      expect(checker.isWithinBoundary('/etc/passwd')).toBe(false);
      expect(checker.isWithinBoundary('/tmp/other/file.txt')).toBe(false);
    });

    // Note: Relative path handling depends on current working directory
    // The above tests thoroughly cover boundary checking
  });

  describe('validatePath', () => {
    it('should return absolute path for valid paths', () => {
      const validPath = path.join(testRoot, 'subdir', 'file.txt');
      const result = checker.validatePath(validPath);
      expect(result).toBe(validPath);
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('should throw for paths outside boundary', () => {
      const invalidPath = path.join(testRoot, '..', 'outside.txt');
      expect(() => checker.validatePath(invalidPath)).toThrow('outside allowed boundaries');
    });

    it('should include root list in error message', () => {
      const invalidPath = '/etc/passwd';
      try {
        checker.validatePath(invalidPath);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain(testRoot);
      }
    });

    it('should validate nested paths', () => {
      const nestedPath = path.join(testRoot, 'a', 'b', 'c', 'file.txt');
      const result = checker.validatePath(nestedPath);
      expect(result).toBe(nestedPath);
    });
  });

  describe('readFile', () => {
    it('should read files within boundary', async () => {
      const filePath = path.join(testRoot, 'test.txt');
      await fs.promises.writeFile(filePath, 'test content');

      const content = await checker.readFile(filePath);
      expect(content).toBe('test content');
    });

    it('should read files in subdirectories', async () => {
      const subdir = path.join(testRoot, 'subdir');
      await fs.promises.mkdir(subdir);
      const filePath = path.join(subdir, 'test.txt');
      await fs.promises.writeFile(filePath, 'nested content');

      const content = await checker.readFile(filePath);
      expect(content).toBe('nested content');
    });

    it('should reject files outside boundary', async () => {
      const outsidePath = path.join(testRoot, '..', 'outside.txt');
      await expect(checker.readFile(outsidePath)).rejects.toThrow('outside allowed boundaries');
    });

    it('should throw descriptive error for non-existent files', async () => {
      const filePath = path.join(testRoot, 'nonexistent.txt');
      await expect(checker.readFile(filePath)).rejects.toThrow('Failed to read file');
    });

    it('should handle UTF-8 content correctly', async () => {
      const filePath = path.join(testRoot, 'unicode.txt');
      const unicodeContent = '你好世界 🌍 привет';
      await fs.promises.writeFile(filePath, unicodeContent);

      const content = await checker.readFile(filePath);
      expect(content).toBe(unicodeContent);
    });
  });

  describe('writeFile', () => {
    it('should write files within boundary', async () => {
      const filePath = path.join(testRoot, 'output.txt');
      await checker.writeFile(filePath, 'new content');

      const content = await fs.promises.readFile(filePath, 'utf-8');
      expect(content).toBe('new content');
    });

    it('should create directories if needed', async () => {
      const filePath = path.join(testRoot, 'new', 'dir', 'structure', 'file.txt');
      await checker.writeFile(filePath, 'content');

      const exists = await checker.exists(filePath);
      expect(exists).toBe(true);

      const content = await fs.promises.readFile(filePath, 'utf-8');
      expect(content).toBe('content');
    });

    it('should reject writes outside boundary', async () => {
      const outsidePath = path.join(testRoot, '..', 'outside.txt');
      await expect(checker.writeFile(outsidePath, 'content')).rejects.toThrow(
        'outside allowed boundaries'
      );
    });

    it('should overwrite existing files', async () => {
      const filePath = path.join(testRoot, 'file.txt');
      await checker.writeFile(filePath, 'first content');
      await checker.writeFile(filePath, 'second content');

      const content = await fs.promises.readFile(filePath, 'utf-8');
      expect(content).toBe('second content');
    });

    it('should handle empty content', async () => {
      const filePath = path.join(testRoot, 'empty.txt');
      await checker.writeFile(filePath, '');

      const content = await fs.promises.readFile(filePath, 'utf-8');
      expect(content).toBe('');
    });
  });

  describe('listDirectory', () => {
    it('should list files in directory', async () => {
      const subdir = path.join(testRoot, 'subdir');
      await fs.promises.mkdir(subdir);
      await fs.promises.writeFile(path.join(subdir, 'file1.txt'), 'content1');
      await fs.promises.writeFile(path.join(subdir, 'file2.txt'), 'content2');

      const entries = await checker.listDirectory(subdir);
      expect(entries).toHaveLength(2);
      expect(entries.some((e) => e.endsWith('file1.txt'))).toBe(true);
      expect(entries.some((e) => e.endsWith('file2.txt'))).toBe(true);
    });

    it('should return full paths', async () => {
      const subdir = path.join(testRoot, 'subdir');
      await fs.promises.mkdir(subdir);
      await fs.promises.writeFile(path.join(subdir, 'file.txt'), 'content');

      const entries = await checker.listDirectory(subdir);
      expect(entries[0]).toContain(testRoot);
      expect(path.isAbsolute(entries[0])).toBe(true);
    });

    it('should return empty array for empty directory', async () => {
      const emptyDir = path.join(testRoot, 'empty');
      await fs.promises.mkdir(emptyDir);

      const entries = await checker.listDirectory(emptyDir);
      expect(entries).toHaveLength(0);
    });

    it('should reject directories outside boundary', async () => {
      const outsideDir = path.join(testRoot, '..', 'outside');
      await expect(checker.listDirectory(outsideDir)).rejects.toThrow('outside allowed boundaries');
    });

    it('should throw for non-existent directories', async () => {
      const nonexistent = path.join(testRoot, 'nonexistent');
      await expect(checker.listDirectory(nonexistent)).rejects.toThrow('Failed to list directory');
    });
  });

  describe('exists', () => {
    it('should return true for existing files', async () => {
      const filePath = path.join(testRoot, 'exists.txt');
      await fs.promises.writeFile(filePath, 'content');

      expect(await checker.exists(filePath)).toBe(true);
    });

    it('should return true for existing directories', async () => {
      const dirPath = path.join(testRoot, 'existingdir');
      await fs.promises.mkdir(dirPath);

      expect(await checker.exists(dirPath)).toBe(true);
    });

    it('should return false for non-existent paths', async () => {
      const nonexistent = path.join(testRoot, 'nonexistent.txt');
      expect(await checker.exists(nonexistent)).toBe(false);
    });

    it('should return false for paths outside boundary', async () => {
      const outsidePath = path.join(testRoot, '..', 'outside.txt');
      expect(await checker.exists(outsidePath)).toBe(false);
    });
  });

  describe('getClosestRoot', () => {
    it('should return root for paths within boundary', () => {
      const filePath = path.join(testRoot, 'file.txt');
      expect(checker.getClosestRoot(filePath)).toBe(testRoot);
    });

    it('should return null for paths outside boundary', () => {
      const outsidePath = '/tmp/outside/file.txt';
      expect(checker.getClosestRoot(outsidePath)).toBe(null);
    });

    it('should return root itself', () => {
      expect(checker.getClosestRoot(testRoot)).toBe(testRoot);
    });
  });

  describe('multiple roots', () => {
    it('should allow paths in any configured root', () => {
      const root2 = path.join(os.tmpdir(), 'mcp-root2-' + Date.now());
      const multiChecker = new FileSystemBoundaryChecker([testRoot, root2]);

      expect(multiChecker.isWithinBoundary(path.join(testRoot, 'file1.txt'))).toBe(true);
      expect(multiChecker.isWithinBoundary(path.join(root2, 'file2.txt'))).toBe(true);
    });

    it('should reject paths outside all roots', () => {
      const root2 = path.join(os.tmpdir(), 'mcp-root2-' + Date.now());
      const multiChecker = new FileSystemBoundaryChecker([testRoot, root2]);

      expect(multiChecker.isWithinBoundary('/etc/passwd')).toBe(false);
    });

    it('should return correct closest root', () => {
      const root2 = path.join(os.tmpdir(), 'mcp-root2-' + Date.now());
      const multiChecker = new FileSystemBoundaryChecker([testRoot, root2]);

      expect(multiChecker.getClosestRoot(path.join(testRoot, 'file.txt'))).toBe(testRoot);
      expect(multiChecker.getClosestRoot(path.join(root2, 'file.txt'))).toBe(root2);
    });
  });

  describe('addRoot', () => {
    it('should allow adding new roots', () => {
      const newRoot = path.join(os.tmpdir(), 'new-root');
      checker.addRoot(newRoot);

      const roots = checker.getAllowedRoots();
      expect(roots).toContain(path.resolve(newRoot));
    });

    it('should allow paths in newly added root', () => {
      const newRoot = path.join(os.tmpdir(), 'new-root');
      checker.addRoot(newRoot);

      expect(checker.isWithinBoundary(path.join(newRoot, 'file.txt'))).toBe(true);
    });
  });

  describe('getAllowedRoots', () => {
    it('should return all configured roots', () => {
      const roots = checker.getAllowedRoots();
      expect(roots).toHaveLength(1);
      expect(roots[0]).toBe(testRoot);
    });

    it('should return copy of roots array', () => {
      const roots1 = checker.getAllowedRoots();
      const roots2 = checker.getAllowedRoots();
      expect(roots1).not.toBe(roots2);
    });
  });

  describe('deleteFile', () => {
    it('should delete files within boundary', async () => {
      const filePath = path.join(testRoot, 'todelete.txt');
      await fs.promises.writeFile(filePath, 'content');

      await checker.deleteFile(filePath);

      expect(await checker.exists(filePath)).toBe(false);
    });

    it('should reject deleting files outside boundary', async () => {
      const outsidePath = path.join(testRoot, '..', 'outside.txt');
      await expect(checker.deleteFile(outsidePath)).rejects.toThrow('outside allowed boundaries');
    });

    it('should throw for non-existent files', async () => {
      const nonexistent = path.join(testRoot, 'nonexistent.txt');
      await expect(checker.deleteFile(nonexistent)).rejects.toThrow('Failed to delete file');
    });
  });

  describe('getStats', () => {
    it('should get stats for files within boundary', async () => {
      const filePath = path.join(testRoot, 'stattest.txt');
      const content = 'test content';
      await fs.promises.writeFile(filePath, content);

      const stats = await checker.getStats(filePath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBe(content.length);
    });

    it('should get stats for directories', async () => {
      const dirPath = path.join(testRoot, 'statdir');
      await fs.promises.mkdir(dirPath);

      const stats = await checker.getStats(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should reject stats for files outside boundary', async () => {
      const outsidePath = path.join(testRoot, '..', 'outside.txt');
      await expect(checker.getStats(outsidePath)).rejects.toThrow('outside allowed boundaries');
    });

    it('should throw for non-existent paths', async () => {
      const nonexistent = path.join(testRoot, 'nonexistent.txt');
      await expect(checker.getStats(nonexistent)).rejects.toThrow('Failed to get stats');
    });
  });

  describe('edge cases', () => {
    it('should handle symlinks (if supported)', async () => {
      // Skip on Windows where symlinks may not work
      if (process.platform === 'win32') {
        return;
      }

      const targetFile = path.join(testRoot, 'target.txt');
      const symlinkFile = path.join(testRoot, 'link.txt');
      await fs.promises.writeFile(targetFile, 'content');
      await fs.promises.symlink(targetFile, symlinkFile);

      const content = await checker.readFile(symlinkFile);
      expect(content).toBe('content');
    });

    it('should handle very long paths', async () => {
      // Create a deeply nested path
      const parts = Array(10).fill('subdir');
      const deepPath = path.join(testRoot, ...parts, 'file.txt');

      await checker.writeFile(deepPath, 'deep content');
      const content = await checker.readFile(deepPath);
      expect(content).toBe('deep content');
    });

    it('should handle special characters in filenames', async () => {
      const specialFile = path.join(testRoot, 'file-with_special.chars.txt');
      await checker.writeFile(specialFile, 'content');

      expect(await checker.exists(specialFile)).toBe(true);
    });
  });
});
