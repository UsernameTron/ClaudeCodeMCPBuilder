/**
 * Capability Validator
 *
 * Ensures MCP servers have valid capability configurations before code generation.
 * Prevents generating broken servers with no capabilities or empty implementations.
 *
 * Validation features:
 * - At least one capability must be enabled
 * - Enabled capabilities must have implementations
 * - Default example generation
 * - Clear error messages
 */

export interface ServerCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
}

export class CapabilityValidator {
  /**
   * Validates that at least one capability is enabled.
   * MCP servers must have at least one capability to be functional.
   *
   * @param capabilities - The capabilities configuration to validate
   * @throws Error if no capabilities are enabled
   *
   * @example
   * CapabilityValidator.validateCapabilities({ tools: true }); // OK
   * CapabilityValidator.validateCapabilities({}); // Throws error
   */
  static validateCapabilities(capabilities: ServerCapabilities): void {
    const hasAnyCapability =
      capabilities.tools || capabilities.resources || capabilities.prompts;

    if (!hasAnyCapability) {
      throw new Error(
        'Server must have at least one capability enabled (tools, resources, or prompts). ' +
          'Add --type tools, --type resources, or --type prompts to your command.'
      );
    }
  }

  /**
   * Validates capability configuration before code generation.
   * Checks that enabled capabilities have at least one implementation.
   *
   * @param config - The configuration to validate
   * @throws Error if enabled capabilities have no implementations
   *
   * @example
   * CapabilityValidator.validateConfiguration({
   *   capabilities: { tools: true },
   *   tools: [{ name: 'echo' }]
   * }); // OK
   *
   * CapabilityValidator.validateConfiguration({
   *   capabilities: { tools: true },
   *   tools: []
   * }); // Throws error
   */
  static validateConfiguration(config: {
    capabilities: ServerCapabilities;
    tools?: unknown[];
    resources?: unknown[];
    prompts?: unknown[];
  }): void {
    this.validateCapabilities(config.capabilities);

    // If capability is enabled, ensure at least one implementation
    if (
      config.capabilities.tools &&
      (!config.tools || config.tools.length === 0)
    ) {
      throw new Error(
        'Tools capability is enabled but no tools are defined. ' +
          'Add --include-examples to generate with example implementations, ' +
          'or define your own tools.'
      );
    }

    if (
      config.capabilities.resources &&
      (!config.resources || config.resources.length === 0)
    ) {
      throw new Error(
        'Resources capability is enabled but no resources are defined. ' +
          'Add --include-examples to generate with example implementations, ' +
          'or define your own resources.'
      );
    }

    if (
      config.capabilities.prompts &&
      (!config.prompts || config.prompts.length === 0)
    ) {
      throw new Error(
        'Prompts capability is enabled but no prompts are defined. ' +
          'Add --include-examples to generate with example implementations, ' +
          'or define your own prompts.'
      );
    }
  }

  /**
   * Gets a list of enabled capabilities.
   *
   * @param capabilities - The capabilities to check
   * @returns Array of enabled capability names
   *
   * @example
   * CapabilityValidator.getEnabledCapabilities({ tools: true, resources: true });
   * // Returns: ['tools', 'resources']
   */
  static getEnabledCapabilities(capabilities: ServerCapabilities): string[] {
    const enabled: string[] = [];

    if (capabilities.tools) enabled.push('tools');
    if (capabilities.resources) enabled.push('resources');
    if (capabilities.prompts) enabled.push('prompts');

    return enabled;
  }

  /**
   * Generates default examples for empty capabilities.
   * Use this to provide starter implementations when capabilities are enabled
   * but no implementations are defined.
   *
   * @param capabilities - The capabilities to generate examples for
   * @returns Object with example implementations for each enabled capability
   *
   * @example
   * const examples = CapabilityValidator.generateDefaultExamples({ tools: true });
   * // Returns: { tools: [{ name: 'echo', ... }] }
   */
  static generateDefaultExamples(capabilities: ServerCapabilities): {
    tools?: unknown[];
    resources?: unknown[];
    prompts?: unknown[];
  } {
    const examples: ReturnType<typeof this.generateDefaultExamples> = {};

    if (capabilities.tools) {
      examples.tools = [
        {
          name: 'echo',
          description: 'Returns the input text - useful for testing',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'Text to echo back',
              },
            },
            required: ['text'],
          },
        },
      ];
    }

    if (capabilities.resources) {
      examples.resources = [
        {
          uri: 'server://info',
          name: 'Server Information',
          description: 'Information about this MCP server',
          mimeType: 'application/json',
        },
      ];
    }

    if (capabilities.prompts) {
      examples.prompts = [
        {
          name: 'analyze_data',
          description: 'Generate a prompt for analyzing data',
          arguments: [
            {
              name: 'data',
              description: 'The data to analyze',
              required: true,
            },
            {
              name: 'focus',
              description: 'What aspect to focus on',
              required: false,
            },
          ],
        },
      ];
    }

    return examples;
  }

  /**
   * Checks if a configuration needs default examples.
   * Returns true if capabilities are enabled but implementations are missing.
   *
   * @param config - The configuration to check
   * @returns true if defaults would help, false otherwise
   *
   * @example
   * CapabilityValidator.needsDefaultExamples({
   *   capabilities: { tools: true },
   *   tools: []
   * }); // Returns: true
   */
  static needsDefaultExamples(config: {
    capabilities: ServerCapabilities;
    tools?: unknown[];
    resources?: unknown[];
    prompts?: unknown[];
  }): boolean {
    let needsDefaults = false;

    if (config.capabilities.tools && (!config.tools || config.tools.length === 0)) {
      needsDefaults = true;
    }

    if (
      config.capabilities.resources &&
      (!config.resources || config.resources.length === 0)
    ) {
      needsDefaults = true;
    }

    if (
      config.capabilities.prompts &&
      (!config.prompts || config.prompts.length === 0)
    ) {
      needsDefaults = true;
    }

    return needsDefaults;
  }

  /**
   * Gets a summary of the configuration state.
   * Useful for reporting and debugging.
   *
   * @param config - The configuration to summarize
   * @returns Human-readable summary
   *
   * @example
   * const summary = CapabilityValidator.getSummary(config);
   * console.log(summary);
   * // "Capabilities: tools (1 implementation), resources (0 implementations)"
   */
  static getSummary(config: {
    capabilities: ServerCapabilities;
    tools?: unknown[];
    resources?: unknown[];
    prompts?: unknown[];
  }): string {
    const parts: string[] = [];

    if (config.capabilities.tools) {
      const count = config.tools?.length || 0;
      parts.push(`tools (${count} implementation${count !== 1 ? 's' : ''})`);
    }

    if (config.capabilities.resources) {
      const count = config.resources?.length || 0;
      parts.push(`resources (${count} implementation${count !== 1 ? 's' : ''})`);
    }

    if (config.capabilities.prompts) {
      const count = config.prompts?.length || 0;
      parts.push(`prompts (${count} implementation${count !== 1 ? 's' : ''})`);
    }

    if (parts.length === 0) {
      return 'No capabilities enabled';
    }

    return `Capabilities: ${parts.join(', ')}`;
  }
}
