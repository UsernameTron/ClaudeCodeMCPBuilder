/**
 * MCP Bundle Packaging
 *
 * Tools for creating .mcpb bundles for MCP servers.
 */

import fs from 'fs/promises';
import path from 'path';
import type { MCPBManifest, GenerateMCPBOptions } from './mcpb-generator.js';
import {
  generateMCPBManifest,
  generateMemoryServerManifest,
  generateFilesystemServerManifest,
  generateGitHubServerManifest,
  generatePostgresServerManifest,
  generateSlackServerManifest,
} from './mcpb-generator.js';

export type {
  MCPBManifest,
  GenerateMCPBOptions,
  UserConfigField,
} from './mcpb-generator.js';

export {
  generateMCPBManifest,
  generateMemoryServerManifest,
  generateFilesystemServerManifest,
  generateGitHubServerManifest,
  generatePostgresServerManifest,
  generateSlackServerManifest,
};

export interface CreateBundleOptions {
  serverPath: string;
  manifest: MCPBManifest;
}

export interface CreateBundleResult {
  manifestPath: string;
  manifest: MCPBManifest;
}

/**
 * Creates a .mcpb bundle manifest for a server
 */
export async function createBundle(options: CreateBundleOptions): Promise<CreateBundleResult> {
  const manifestPath = path.join(options.serverPath, 'manifest.json');

  // Write manifest
  await fs.writeFile(manifestPath, JSON.stringify(options.manifest, null, 2));

  return {
    manifestPath,
    manifest: options.manifest,
  };
}

/**
 * Auto-generates manifest based on example server type
 */
export async function createBundleForExample(
  exampleId: string,
  serverPath: string,
  serverName: string,
  author: { name: string; email?: string; url?: string }
): Promise<CreateBundleResult> {
  let manifest: MCPBManifest;

  switch (exampleId) {
    case 'memory':
      manifest = generateMemoryServerManifest(serverName, author);
      break;

    case 'filesystem':
      manifest = generateFilesystemServerManifest(serverName, author);
      break;

    case 'github':
      manifest = generateGitHubServerManifest(serverName, author);
      break;

    case 'postgres':
      manifest = generatePostgresServerManifest(serverName, author);
      break;

    case 'slack':
      manifest = generateSlackServerManifest(serverName, author);
      break;

    default:
      throw new Error(`Unknown example ID: ${exampleId}`);
  }

  return createBundle({ serverPath, manifest });
}
