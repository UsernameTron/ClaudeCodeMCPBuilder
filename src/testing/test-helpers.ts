/**
 * Test Helpers
 *
 * Utility functions for testing MCP servers.
 * Provides common assertions and validation helpers.
 */

import assert from 'node:assert';

/**
 * Assert that a response is not an error
 */
export function assertNotError(response: any, message?: string): void {
  assert.strictEqual(
    response.isError,
    undefined,
    message || `Expected success but got error: ${JSON.stringify(response)}`
  );
}

/**
 * Assert that a response is an error
 */
export function assertIsError(response: any, message?: string): void {
  assert.strictEqual(
    response.isError,
    true,
    message || 'Expected error response but got success'
  );
}

/**
 * Assert that response contains specific text
 */
export function assertContainsText(response: any, text: string, message?: string): void {
  assert.ok(response.content, 'Response should have content array');
  const hasText = response.content.some(
    (item: any) => item.type === 'text' && item.text.includes(text)
  );
  assert.ok(hasText, message || `Expected response to contain "${text}"`);
}

/**
 * Assert tool list contains specific tool
 */
export function assertHasTool(tools: any, toolName: string): void {
  assert.ok(tools.tools, 'Response should have tools array');
  const tool = tools.tools.find((t: any) => t.name === toolName);
  assert.ok(tool, `Expected to find tool named "${toolName}"`);
}

/**
 * Assert resource list contains specific resource
 */
export function assertHasResource(resources: any, uri: string): void {
  assert.ok(resources.resources, 'Response should have resources array');
  const resource = resources.resources.find((r: any) => r.uri === uri);
  assert.ok(resource, `Expected to find resource with URI "${uri}"`);
}

/**
 * Assert prompt list contains specific prompt
 */
export function assertHasPrompt(prompts: any, promptName: string): void {
  assert.ok(prompts.prompts, 'Response should have prompts array');
  const prompt = prompts.prompts.find((p: any) => p.name === promptName);
  assert.ok(prompt, `Expected to find prompt named "${promptName}"`);
}

/**
 * Assert response matches schema structure
 */
export function assertMatchesSchema(data: any, schema: any): void {
  if (schema.type === 'object') {
    assert.strictEqual(typeof data, 'object', 'Expected object type');
    if (schema.required) {
      for (const key of schema.required) {
        assert.ok(
          key in data,
          `Expected required property "${key}" in response`
        );
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          assertMatchesSchema(data[key], propSchema);
        }
      }
    }
  } else if (schema.type === 'array') {
    assert.ok(Array.isArray(data), 'Expected array type');
  } else if (schema.type === 'string') {
    assert.strictEqual(typeof data, 'string', 'Expected string type');
  } else if (schema.type === 'number') {
    assert.strictEqual(typeof data, 'number', 'Expected number type');
  } else if (schema.type === 'boolean') {
    assert.strictEqual(typeof data, 'boolean', 'Expected boolean type');
  }
}

/**
 * Assert tool output matches its declared output schema
 */
export function assertToolOutputValid(toolDef: any, response: any): void {
  assertNotError(response, 'Tool should not return error');

  if (toolDef.outputSchema && response.content) {
    const textContent = response.content.find((c: any) => c.type === 'text');
    if (textContent) {
      try {
        const parsed = JSON.parse(textContent.text);
        assertMatchesSchema(parsed, toolDef.outputSchema);
      } catch (e) {
        assert.fail(`Tool output is not valid JSON: ${textContent.text}`);
      }
    }
  }
}

/**
 * Assert error message is actionable (contains helpful guidance)
 */
export function assertActionableError(response: any): void {
  assertIsError(response);
  assertContainsText(
    response,
    'please',
    'Error messages should be actionable and polite (should contain guidance)'
  );
}

/**
 * Test security: assert path traversal is blocked
 */
export async function assertBlocksPathTraversal(
  callTool: (args: any) => Promise<any>,
  pathArg: string = 'path'
): Promise<void> {
  const maliciousPaths = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '/etc/passwd',
    'C:\\Windows\\System32\\config\\sam',
    './../../sensitive/file.txt'
  ];

  for (const path of maliciousPaths) {
    const response = await callTool({ [pathArg]: path });
    assertIsError(
      response,
      `Path traversal should be blocked for: ${path}`
    );
  }
}

/**
 * Test rate limiting
 */
export async function assertRateLimitEnforced(
  operation: () => Promise<any>,
  maxRequests: number = 100,
  timeWindowMs: number = 1000
): Promise<void> {
  const start = Date.now();
  let errorCount = 0;

  // Make requests rapidly
  for (let i = 0; i < maxRequests + 10; i++) {
    try {
      const response = await operation();
      if (response.isError && response.content[0].text.includes('rate limit')) {
        errorCount++;
      }
    } catch (error: any) {
      if (error.message.includes('rate limit')) {
        errorCount++;
      }
    }
  }

  const elapsed = Date.now() - start;

  // If we completed too many requests too quickly, rate limiting may not be working
  if (elapsed < timeWindowMs && errorCount === 0) {
    assert.fail(
      `Rate limiting does not appear to be working: completed ${maxRequests + 10} requests in ${elapsed}ms with no errors`
    );
  }
}

/**
 * Test pagination
 */
export async function assertPaginationWorks(
  listOperation: (cursor?: string) => Promise<any>
): Promise<void> {
  const firstPage = await listOperation();
  assert.ok(firstPage.contents || firstPage.resources || firstPage.tools, 'First page should have results');

  if (firstPage.nextCursor) {
    const secondPage = await listOperation(firstPage.nextCursor);
    assert.ok(secondPage.contents || secondPage.resources || secondPage.tools, 'Second page should have results');

    // Ensure pages are different
    const firstIds = JSON.stringify(firstPage);
    const secondIds = JSON.stringify(secondPage);
    assert.notStrictEqual(firstIds, secondIds, 'Pages should contain different results');
  }
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}

/**
 * Mock delay for testing timeouts
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random test data
 */
export function generateTestData(type: 'string' | 'number' | 'object' | 'array'): any {
  switch (type) {
    case 'string':
      return `test_${Math.random().toString(36).substring(7)}`;
    case 'number':
      return Math.floor(Math.random() * 1000);
    case 'object':
      return {
        id: generateTestData('number'),
        name: generateTestData('string'),
        timestamp: new Date().toISOString()
      };
    case 'array':
      return [
        generateTestData('object'),
        generateTestData('object'),
        generateTestData('object')
      ];
  }
}

/**
 * Validate MCP error response format
 */
export function assertValidErrorFormat(response: any): void {
  assertIsError(response);
  assert.ok(response.content, 'Error response should have content array');
  assert.ok(Array.isArray(response.content), 'Content should be an array');
  assert.ok(response.content.length > 0, 'Error content should not be empty');

  const textContent = response.content.find((c: any) => c.type === 'text');
  assert.ok(textContent, 'Error should have text content');
  assert.ok(textContent.text.length > 0, 'Error text should not be empty');

  // Error messages should not leak sensitive information
  const sensitivePatterns = [
    /\/home\/[a-z]+/i,
    /\/users\/[a-z]+/i,
    /c:\\users\\/i,
    /password/i,
    /secret/i,
    /token/i,
    /key.*=/i
  ];

  for (const pattern of sensitivePatterns) {
    assert.ok(
      !pattern.test(textContent.text),
      `Error message should not contain sensitive information matching: ${pattern}`
    );
  }
}
