#!/usr/bin/env node
/**
 * Test Script: Example Server Generation
 *
 * Tests the new production-ready example generation functionality.
 */

import { generateFromExample } from './examples/generator.js';
import { getAllExamples, type ExampleServer } from './examples/catalog.js';
import path from 'path';
import fs from 'fs/promises';

async function main() {
  console.log('🧪 Testing Example Server Generation\n');

  // List available examples
  console.log('📋 Available Production Examples:');
  const allExamples = getAllExamples();
  allExamples.forEach((ex: ExampleServer, idx: number) => {
    const authIcon = ex.requiresAuth ? '🔐' : '🔓';
    const complexityColor = ex.complexity === 'beginner' ? '🟢' : ex.complexity === 'intermediate' ? '🟡' : '🔴';
    console.log(`  ${idx + 1}. ${authIcon} ${complexityColor} ${ex.name} - ${ex.description}`);
  });

  console.log('\n🎯 Testing: Memory Server Generation (no auth required)\n');

  // Test output directory
  const testOutputDir = path.join(process.cwd(), 'test-output');

  // Clean up if exists
  try {
    await fs.rm(testOutputDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore if doesn't exist
  }

  // Generate Memory server
  try {
    const result = await generateFromExample({
      exampleId: 'memory',
      name: 'test-memory-server',
      outputDir: testOutputDir,
      customizePackageName: true,
    });

    console.log('✅ Generation successful!\n');
    console.log(`📁 Server created at: ${result.path}\n`);

    console.log(`📄 Files created (${result.filesCreated.length} total):`);
    result.filesCreated.slice(0, 10).forEach((file: string) => {
      console.log(`   - ${file}`);
    });
    if (result.filesCreated.length > 10) {
      console.log(`   ... and ${result.filesCreated.length - 10} more files`);
    }

    console.log('\n📝 Configuration Steps:');
    result.configurationSteps.forEach((step: string) => {
      console.log(`   ${step}`);
    });

    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warning: string) => {
        console.log(`   ${warning}`);
      });
    }

    // Verify key files exist
    console.log('\n🔍 Verifying generated files...');
    const serverPath = result.path;
    const expectedFiles = [
      'package.json',
      'tsconfig.json',
      'README.md',
      'CONFIGURATION.md',
      'index.ts',
    ];

    for (const file of expectedFiles) {
      try {
        await fs.access(path.join(serverPath, file));
        console.log(`   ✓ ${file}`);
      } catch (error) {
        console.log(`   ✗ ${file} - MISSING!`);
      }
    }

    // Check package.json was customized
    console.log('\n📦 Checking package.json customization...');
    const pkgContent = await fs.readFile(path.join(serverPath, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgContent);

    console.log(`   Name: ${pkg.name}`);
    console.log(`   Version: ${pkg.version}`);
    console.log(`   Description: ${pkg.description}`);

    if (pkg.name === 'test-memory-server') {
      console.log('   ✓ Package name customized correctly');
    } else {
      console.log('   ✗ Package name not customized');
    }

    // Check CONFIGURATION.md exists and has content
    console.log('\n📖 Checking CONFIGURATION.md...');
    const configContent = await fs.readFile(path.join(serverPath, 'CONFIGURATION.md'), 'utf-8');
    console.log(`   ✓ Configuration guide generated (${configContent.length} characters)`);
    console.log(`   ✓ Contains: ${configContent.includes('Memory File Path') ? 'Memory-specific instructions' : 'Generic instructions'}`);

    console.log('\n✅ All tests passed!\n');
    console.log(`🎯 Next step: cd ${result.path} && npm install && npm run build\n`);

  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
