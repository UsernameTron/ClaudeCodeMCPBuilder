/**
 * Testing Utilities
 *
 * Exports all testing utilities for MCP server validation.
 */

export {
  MCPTestClient,
  createTestClient,
  testServer,
  type TestClientConfig
} from './mcp-test-client.js';

export {
  assertNotError,
  assertIsError,
  assertContainsText,
  assertHasTool,
  assertHasResource,
  assertHasPrompt,
  assertMatchesSchema,
  assertToolOutputValid,
  assertActionableError,
  assertBlocksPathTraversal,
  assertRateLimitEnforced,
  assertPaginationWorks,
  assertValidErrorFormat,
  waitFor,
  delay,
  generateTestData
} from './test-helpers.js';
