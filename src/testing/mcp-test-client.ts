/**
 * MCP Test Client
 *
 * A test client for validating MCP server implementations.
 * This provides utilities for:
 * - Starting server processes
 * - Connecting via stdio transport
 * - Calling MCP methods (tools, resources, prompts)
 * - Validating responses against schemas
 * - Testing error handling
 */

import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Configuration for test client
 */
export interface TestClientConfig {
  serverPath: string;
  serverArgs?: string[];
  env?: Record<string, string>;
  timeout?: number;
}

/**
 * Test client for MCP servers
 */
export class MCPTestClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;
  private config: TestClientConfig;

  constructor(config: TestClientConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };
  }

  /**
   * Start the server and connect
   */
  async connect(): Promise<void> {
    try {
      // Spawn server process
      this.serverProcess = spawn(
        'node',
        [this.config.serverPath, ...(this.config.serverArgs || [])],
        {
          env: { ...process.env, ...this.config.env },
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      // Handle server errors
      this.serverProcess.on('error', (error) => {
        throw new Error(`Server process error: ${error.message}`);
      });

      // Create transport and client
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [this.config.serverPath, ...(this.config.serverArgs || [])],
        env: { ...process.env, ...this.config.env }
      });

      this.client = new Client(
        {
          name: 'test-client',
          version: '1.0.0'
        },
        {
          capabilities: {
            roots: {
              listChanged: true
            },
            sampling: {}
          }
        }
      );

      await this.client.connect(this.transport);
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return await this.client.request({ method: 'tools/list' }, { timeout: this.config.timeout });
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return await this.client.request(
      {
        method: 'tools/call',
        params: { name, arguments: args }
      },
      { timeout: this.config.timeout }
    );
  }

  /**
   * List available resources
   */
  async listResources(): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return await this.client.request({ method: 'resources/list' }, { timeout: this.config.timeout });
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return await this.client.request(
      {
        method: 'resources/read',
        params: { uri }
      },
      { timeout: this.config.timeout }
    );
  }

  /**
   * Subscribe to a resource
   */
  async subscribe(uri: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    await this.client.request(
      {
        method: 'resources/subscribe',
        params: { uri }
      },
      { timeout: this.config.timeout }
    );
  }

  /**
   * Unsubscribe from a resource
   */
  async unsubscribe(uri: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    await this.client.request(
      {
        method: 'resources/unsubscribe',
        params: { uri }
      },
      { timeout: this.config.timeout }
    );
  }

  /**
   * List available prompts
   */
  async listPrompts(): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return await this.client.request({ method: 'prompts/list' }, { timeout: this.config.timeout });
  }

  /**
   * Get a prompt
   */
  async getPrompt(name: string, args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return await this.client.request(
      {
        method: 'prompts/get',
        params: { name, arguments: args }
      },
      { timeout: this.config.timeout }
    );
  }

  /**
   * Set roots for the session
   */
  async setRoots(roots: Array<{ uri: string; name: string }>): Promise<void> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    await this.client.request(
      {
        method: 'notifications/roots/list_changed',
        params: { roots }
      },
      { timeout: this.config.timeout }
    );
  }

  /**
   * Close the connection and cleanup
   */
  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }

      if (this.serverProcess) {
        this.serverProcess.kill();
        this.serverProcess = null;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Helper function to create and connect a test client
 */
export async function createTestClient(config: TestClientConfig): Promise<MCPTestClient> {
  const client = new MCPTestClient(config);
  await client.connect();
  return client;
}

/**
 * Test suite helper for MCP servers
 */
export async function testServer(
  serverPath: string,
  tests: (client: MCPTestClient) => Promise<void>
): Promise<void> {
  const client = await createTestClient({ serverPath });
  try {
    await tests(client);
  } finally {
    await client.close();
  }
}
