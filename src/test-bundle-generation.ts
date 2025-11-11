#!/usr/bin/env node
/**
 * Test Script: .mcpb Bundle Generation
 *
 * Tests the new .mcpb bundle generation functionality.
 */

import { generateFromExample } from './examples/generator.js';
import path from 'path';
import fs from 'fs/promises';

async function main() {
  console.log('🎁 Testing .mcpb Bundle Generation\n');

  // Test output directory
  const testOutputDir = path.join(process.cwd(), 'test-output-bundle');

  // Clean up if exists
  try {
    await fs.rm(testOutputDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore if doesn't exist
  }

  console.log('🎯 Generating Memory Server with .mcpb bundle\n');

  // Generate Memory server with bundle
  try {
    const result = await generateFromExample({
      exampleId: 'memory',
      name: 'test-memory-bundle',
      outputDir: testOutputDir,
      customizePackageName: true,
      createBundle: true,
      bundleAuthor: {
        name: 'MCP Builder Test',
        email: 'test@example.com',
        url: 'https://example.com',
      },
    });

    console.log('✅ Generation successful!\n');
    console.log(`📁 Server created at: ${result.path}\n`);

    if (result.bundlePath) {
      console.log(`📦 Bundle manifest created at: ${result.bundlePath}\n`);

      // Read and display the manifest
      const manifestContent = await fs.readFile(result.bundlePath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      console.log('📄 Manifest Contents:');
      console.log('─'.repeat(60));
      console.log(`  Name: ${manifest.name}`);
      console.log(`  Display Name: ${manifest.display_name}`);
      console.log(`  Version: ${manifest.version}`);
      console.log(`  Description: ${manifest.description}`);
      console.log(`  Author: ${manifest.author.name} <${manifest.author.email}>`);
      console.log(`  Server Type: ${manifest.server.type}`);
      console.log(`  Entry Point: ${manifest.server.entry_point}`);
      console.log(`  Tools: ${manifest.tools?.length || 0} tools`);
      console.log(`  User Config: ${Object.keys(manifest.user_config || {}).length} fields`);
      console.log('─'.repeat(60));

      // Validate manifest structure
      console.log('\n🔍 Validating manifest structure...');

      const required = ['manifest_version', 'name', 'version', 'description', 'author', 'server'];
      const missing = required.filter((field) => !(field in manifest));

      if (missing.length > 0) {
        console.log(`  ✗ Missing required fields: ${missing.join(', ')}`);
      } else {
        console.log('  ✓ All required fields present');
      }

      if (manifest.manifest_version === '0.3') {
        console.log('  ✓ Correct manifest version (0.3)');
      } else {
        console.log(`  ✗ Incorrect manifest version: ${manifest.manifest_version}`);
      }

      if (manifest.tools && Array.isArray(manifest.tools)) {
        console.log(`  ✓ Tools array defined (${manifest.tools.length} tools)`);
        manifest.tools.slice(0, 3).forEach((tool: any) => {
          console.log(`     - ${tool.name}: ${tool.description}`);
        });
        if (manifest.tools.length > 3) {
          console.log(`     ... and ${manifest.tools.length - 3} more`);
        }
      }

      if (manifest.user_config) {
        console.log(`  ✓ User config defined (${Object.keys(manifest.user_config).length} fields)`);
        Object.entries(manifest.user_config).forEach(([key, config]: [string, any]) => {
          console.log(`     - ${key}: ${config.title} (${config.type}${config.required ? ', required' : ''})`);
        });
      }

      if (manifest.compatibility) {
        console.log('  ✓ Compatibility info defined');
        console.log(`     - Platforms: ${manifest.compatibility.platforms?.join(', ')}`);
        console.log(`     - Runtimes: ${JSON.stringify(manifest.compatibility.runtimes)}`);
      }

      console.log('\n✅ All validation checks passed!');
      console.log('\n📝 Next Steps:');
      console.log(`  1. cd ${result.path}`);
      console.log('  2. npm install');
      console.log('  3. npm run build');
      console.log('  4. Install with Claude Desktop using the manifest.json');
    } else {
      console.log('❌ Bundle manifest not created');
    }
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
