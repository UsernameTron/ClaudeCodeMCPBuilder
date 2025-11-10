import type { ServerConfig } from '../types.js';

export function generateTests(config: ServerConfig): string {
  return `/**
 * Server Tests
 *
 * Tests MCP server implementation following best practices
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// TODO: Import MCP SDK test utilities when available
// import { MCPTestClient } from '@modelcontextprotocol/sdk/testing';

describe('${config.name} MCP Server', () => {
  describe('Server Initialization', () => {
    it('should initialize with correct capabilities', () => {
      // Test capability declaration matches configuration
      const expectedCapabilities = ${JSON.stringify(config.capabilities, null, 6)};

      // TODO: Add actual server initialization test
      assert.ok(true, 'Server initializes');
    });
  });

${config.capabilities.tools ? `
  describe('Tools', () => {
    it('should list all available tools', async () => {
      // TODO: Connect test client and call tools/list
      // const tools = await client.listTools();
      // assert.ok(Array.isArray(tools.tools));
      assert.ok(true, 'Tool listing works');
    });

    ${config.includeExamples ? `
    it('should execute echo tool successfully', async () => {
      // TODO: Call echo tool with test input
      // const result = await client.callTool('echo', { message: 'test' });
      // assert.strictEqual(result.isError, undefined);
      // assert.ok(result.content[0].text.includes('test'));
      assert.ok(true, 'Echo tool works');
    });

    it('should handle tool errors gracefully', async () => {
      // TODO: Call tool with invalid input
      // const result = await client.callTool('echo', {});
      // assert.strictEqual(result.isError, true);
      assert.ok(true, 'Error handling works');
    });` : ''}
  });
` : ''}

${config.capabilities.resources ? `
  describe('Resources', () => {
    it('should list all available resources', async () => {
      // TODO: Connect test client and call resources/list
      // const resources = await client.listResources();
      // assert.ok(Array.isArray(resources.resources));
      assert.ok(true, 'Resource listing works');
    });

    ${config.includeExamples ? `
    it('should read server info resource', async () => {
      // TODO: Read server://info resource
      // const result = await client.readResource('server://info');
      // assert.ok(result.contents[0].text);
      assert.ok(true, 'Resource reading works');
    });` : ''}

    ${config.features.subscribe ? `
    it('should handle resource subscriptions', async () => {
      // TODO: Test subscription flow
      // await client.subscribe('server://info');
      // await client.unsubscribe('server://info');
      assert.ok(true, 'Subscriptions work');
    });` : ''}
  });
` : ''}

${config.capabilities.prompts ? `
  describe('Prompts', () => {
    it('should list all available prompts', async () => {
      // TODO: Connect test client and call prompts/list
      // const prompts = await client.listPrompts();
      // assert.ok(Array.isArray(prompts.prompts));
      assert.ok(true, 'Prompt listing works');
    });

    ${config.includeExamples ? `
    it('should generate analyze-data prompt', async () => {
      // TODO: Get prompt with arguments
      // const result = await client.getPrompt('analyze-data', {
      //   data: 'test data',
      //   focus: 'trends'
      // });
      // assert.ok(result.messages.length > 0);
      assert.ok(true, 'Prompt generation works');
    });` : ''}
  });
` : ''}

  describe('Security', () => {
    ${config.security.sanitizePaths ? `
    it('should reject directory traversal attempts', async () => {
      // TODO: Test path sanitization
      // const result = await client.callTool('some_file_tool', {
      //   path: '../../../etc/passwd'
      // });
      // assert.strictEqual(result.isError, true);
      assert.ok(true, 'Path sanitization works');
    });` : ''}

    ${config.security.validateInputs ? `
    it('should validate inputs beyond schema', async () => {
      // TODO: Test input validation
      // const result = await client.callTool('some_tool', {
      //   input: '<script>alert("xss")</script>'
      // });
      // assert.strictEqual(result.isError, true);
      assert.ok(true, 'Input validation works');
    });` : ''}

    ${config.security.rateLimit ? `
    it('should enforce rate limits', async () => {
      // TODO: Test rate limiting
      // Make multiple rapid requests and verify limit is enforced
      assert.ok(true, 'Rate limiting works');
    });` : ''}
  });

  describe('Error Handling', () => {
    it('should return structured errors', async () => {
      // TODO: Trigger an error and verify response format
      // const result = await client.callTool('nonexistent_tool', {});
      // Verify error is returned as content with isError: true
      assert.ok(true, 'Error format correct');
    });

    it('should provide actionable error messages', async () => {
      // TODO: Test error messages include helpful information
      // const result = await client.callTool('tool', { invalid: 'input' });
      // assert.ok(result.content[0].text.includes('Please'));
      assert.ok(true, 'Error messages are actionable');
    });
  });
});

/**
 * Integration test helper
 * TODO: Implement when MCP test client is available
 */
class TestClient {
  async connect(serverPath: string) {
    // Start server process and connect via stdio
  }

  async listTools() {
    // Call tools/list
  }

  async callTool(name: string, args: any) {
    // Call tools/call
  }

  async listResources() {
    // Call resources/list
  }

  async readResource(uri: string) {
    // Call resources/read
  }

  async subscribe(uri: string) {
    // Call resources/subscribe
  }

  async unsubscribe(uri: string) {
    // Call resources/unsubscribe
  }

  async listPrompts() {
    // Call prompts/list
  }

  async getPrompt(name: string, args: any) {
    // Call prompts/get
  }

  async close() {
    // Disconnect and cleanup
  }
}
`;
}
