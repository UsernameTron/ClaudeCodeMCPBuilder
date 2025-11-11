/**
 * Capability Validator Tests
 *
 * Comprehensive test suite covering:
 * - Capability validation
 * - Configuration validation
 * - Default example generation
 * - Helper methods
 * - Error messages
 */

import { describe, it, expect } from 'vitest';
import { CapabilityValidator } from './capabilityValidator';

describe('CapabilityValidator', () => {
  describe('validateCapabilities', () => {
    it('should accept tools capability', () => {
      expect(() => {
        CapabilityValidator.validateCapabilities({ tools: true });
      }).not.toThrow();
    });

    it('should accept resources capability', () => {
      expect(() => {
        CapabilityValidator.validateCapabilities({ resources: true });
      }).not.toThrow();
    });

    it('should accept prompts capability', () => {
      expect(() => {
        CapabilityValidator.validateCapabilities({ prompts: true });
      }).not.toThrow();
    });

    it('should accept multiple capabilities', () => {
      expect(() => {
        CapabilityValidator.validateCapabilities({
          tools: true,
          resources: true,
          prompts: true,
        });
      }).not.toThrow();
    });

    it('should reject empty capabilities object', () => {
      expect(() => {
        CapabilityValidator.validateCapabilities({});
      }).toThrow('at least one capability');
    });

    it('should reject all false capabilities', () => {
      expect(() => {
        CapabilityValidator.validateCapabilities({
          tools: false,
          resources: false,
          prompts: false,
        });
      }).toThrow('at least one capability');
    });

    it('should provide helpful error message', () => {
      try {
        CapabilityValidator.validateCapabilities({});
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('tools, resources, or prompts');
      }
    });
  });

  describe('validateConfiguration', () => {
    it('should accept configuration with tools', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true },
          tools: [{ name: 'test_tool' }],
        });
      }).not.toThrow();
    });

    it('should accept configuration with resources', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { resources: true },
          resources: [{ uri: 'test://resource' }],
        });
      }).not.toThrow();
    });

    it('should accept configuration with prompts', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { prompts: true },
          prompts: [{ name: 'test_prompt' }],
        });
      }).not.toThrow();
    });

    it('should accept configuration with all capabilities', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true, resources: true, prompts: true },
          tools: [{ name: 'tool' }],
          resources: [{ uri: 'resource' }],
          prompts: [{ name: 'prompt' }],
        });
      }).not.toThrow();
    });

    it('should reject tools capability with empty array', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true },
          tools: [],
        });
      }).toThrow('no tools are defined');
    });

    it('should reject tools capability with undefined tools', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true },
        });
      }).toThrow('no tools are defined');
    });

    it('should reject resources capability with empty array', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { resources: true },
          resources: [],
        });
      }).toThrow('no resources are defined');
    });

    it('should reject prompts capability with empty array', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { prompts: true },
          prompts: [],
        });
      }).toThrow('no prompts are defined');
    });

    it('should provide helpful error message for tools', () => {
      try {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true },
          tools: [],
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('--include-examples');
      }
    });

    it('should allow disabled capabilities to have no implementations', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true },
          tools: [{ name: 'tool' }],
          resources: [], // Disabled, so empty is OK
          prompts: [], // Disabled, so empty is OK
        });
      }).not.toThrow();
    });
  });

  describe('getEnabledCapabilities', () => {
    it('should return empty array for no capabilities', () => {
      const result = CapabilityValidator.getEnabledCapabilities({});
      expect(result).toEqual([]);
    });

    it('should return single capability', () => {
      const result = CapabilityValidator.getEnabledCapabilities({ tools: true });
      expect(result).toEqual(['tools']);
    });

    it('should return multiple capabilities in order', () => {
      const result = CapabilityValidator.getEnabledCapabilities({
        tools: true,
        resources: true,
        prompts: true,
      });
      expect(result).toEqual(['tools', 'resources', 'prompts']);
    });

    it('should only return enabled capabilities', () => {
      const result = CapabilityValidator.getEnabledCapabilities({
        tools: true,
        resources: false,
        prompts: true,
      });
      expect(result).toEqual(['tools', 'prompts']);
    });

    it('should handle undefined as disabled', () => {
      const result = CapabilityValidator.getEnabledCapabilities({
        tools: true,
        resources: undefined,
      });
      expect(result).toEqual(['tools']);
    });
  });

  describe('generateDefaultExamples', () => {
    it('should generate default tool example', () => {
      const examples = CapabilityValidator.generateDefaultExamples({ tools: true });
      expect(examples.tools).toBeDefined();
      expect(examples.tools?.length).toBeGreaterThan(0);
      expect(examples.tools?.[0]).toHaveProperty('name');
      expect(examples.tools?.[0]).toHaveProperty('description');
      expect(examples.tools?.[0]).toHaveProperty('inputSchema');
    });

    it('should generate default resource example', () => {
      const examples = CapabilityValidator.generateDefaultExamples({ resources: true });
      expect(examples.resources).toBeDefined();
      expect(examples.resources?.length).toBeGreaterThan(0);
      expect(examples.resources?.[0]).toHaveProperty('uri');
      expect(examples.resources?.[0]).toHaveProperty('name');
    });

    it('should generate default prompt example', () => {
      const examples = CapabilityValidator.generateDefaultExamples({ prompts: true });
      expect(examples.prompts).toBeDefined();
      expect(examples.prompts?.length).toBeGreaterThan(0);
      expect(examples.prompts?.[0]).toHaveProperty('name');
      expect(examples.prompts?.[0]).toHaveProperty('description');
    });

    it('should generate examples for all enabled capabilities', () => {
      const examples = CapabilityValidator.generateDefaultExamples({
        tools: true,
        resources: true,
        prompts: true,
      });

      expect(examples.tools).toBeDefined();
      expect(examples.resources).toBeDefined();
      expect(examples.prompts).toBeDefined();
    });

    it('should not generate examples for disabled capabilities', () => {
      const examples = CapabilityValidator.generateDefaultExamples({ tools: true });
      expect(examples.resources).toBeUndefined();
      expect(examples.prompts).toBeUndefined();
    });

    it('should generate empty object for no capabilities', () => {
      const examples = CapabilityValidator.generateDefaultExamples({});
      expect(Object.keys(examples)).toHaveLength(0);
    });

    it('should generate valid echo tool example', () => {
      const examples = CapabilityValidator.generateDefaultExamples({ tools: true });
      const tool = examples.tools?.[0] as any;
      expect(tool.name).toBe('echo');
      expect(tool.inputSchema.properties).toHaveProperty('text');
    });

    it('should generate valid server info resource example', () => {
      const examples = CapabilityValidator.generateDefaultExamples({ resources: true });
      const resource = examples.resources?.[0] as any;
      expect(resource.uri).toBe('server://info');
      expect(resource.mimeType).toBe('application/json');
    });

    it('should generate valid analyze_data prompt example', () => {
      const examples = CapabilityValidator.generateDefaultExamples({ prompts: true });
      const prompt = examples.prompts?.[0] as any;
      expect(prompt.name).toBe('analyze_data');
      expect(prompt.arguments).toBeDefined();
      expect(Array.isArray(prompt.arguments)).toBe(true);
    });
  });

  describe('needsDefaultExamples', () => {
    it('should return false when all enabled capabilities have implementations', () => {
      const result = CapabilityValidator.needsDefaultExamples({
        capabilities: { tools: true },
        tools: [{ name: 'tool' }],
      });
      expect(result).toBe(false);
    });

    it('should return true when tools capability has no implementations', () => {
      const result = CapabilityValidator.needsDefaultExamples({
        capabilities: { tools: true },
        tools: [],
      });
      expect(result).toBe(true);
    });

    it('should return true when tools is undefined', () => {
      const result = CapabilityValidator.needsDefaultExamples({
        capabilities: { tools: true },
      });
      expect(result).toBe(true);
    });

    it('should return true when any capability needs defaults', () => {
      const result = CapabilityValidator.needsDefaultExamples({
        capabilities: { tools: true, resources: true },
        tools: [{ name: 'tool' }],
        resources: [], // Empty!
      });
      expect(result).toBe(true);
    });

    it('should return false when no capabilities are enabled', () => {
      const result = CapabilityValidator.needsDefaultExamples({
        capabilities: {},
      });
      expect(result).toBe(false);
    });

    it('should return false when disabled capabilities are empty', () => {
      const result = CapabilityValidator.needsDefaultExamples({
        capabilities: { tools: true },
        tools: [{ name: 'tool' }],
        resources: [], // OK because resources not enabled
      });
      expect(result).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return summary for single capability', () => {
      const summary = CapabilityValidator.getSummary({
        capabilities: { tools: true },
        tools: [{ name: 'tool' }],
      });
      expect(summary).toContain('tools');
      expect(summary).toContain('1 implementation');
    });

    it('should use singular for 1 implementation', () => {
      const summary = CapabilityValidator.getSummary({
        capabilities: { tools: true },
        tools: [{ name: 'tool' }],
      });
      expect(summary).toContain('1 implementation');
      expect(summary).not.toContain('implementations');
    });

    it('should use plural for multiple implementations', () => {
      const summary = CapabilityValidator.getSummary({
        capabilities: { tools: true },
        tools: [{ name: 'tool1' }, { name: 'tool2' }],
      });
      expect(summary).toContain('2 implementations');
    });

    it('should show 0 implementations for empty arrays', () => {
      const summary = CapabilityValidator.getSummary({
        capabilities: { tools: true },
        tools: [],
      });
      expect(summary).toContain('0 implementations');
    });

    it('should show all enabled capabilities', () => {
      const summary = CapabilityValidator.getSummary({
        capabilities: { tools: true, resources: true, prompts: true },
        tools: [{ name: 'tool' }],
        resources: [{ uri: 'res' }],
        prompts: [{ name: 'prompt' }],
      });
      expect(summary).toContain('tools');
      expect(summary).toContain('resources');
      expect(summary).toContain('prompts');
    });

    it('should return message for no capabilities', () => {
      const summary = CapabilityValidator.getSummary({
        capabilities: {},
      });
      expect(summary).toBe('No capabilities enabled');
    });

    it('should format summary correctly', () => {
      const summary = CapabilityValidator.getSummary({
        capabilities: { tools: true, resources: true },
        tools: [{ name: 'tool' }],
        resources: [{ uri: 'r1' }, { uri: 'r2' }],
      });
      expect(summary).toMatch(/Capabilities: tools \(1 implementation\), resources \(2 implementations\)/);
    });
  });

  describe('edge cases', () => {
    it('should handle null arrays as missing', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true },
          tools: null as any,
        });
      }).toThrow('no tools are defined');
    });

    it('should handle very large arrays', () => {
      const manyTools = Array(1000)
        .fill(null)
        .map((_, i) => ({ name: `tool${i}` }));

      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true },
          tools: manyTools,
        });
      }).not.toThrow();
    });

    it('should handle mixed enabled/disabled capabilities', () => {
      expect(() => {
        CapabilityValidator.validateConfiguration({
          capabilities: { tools: true, resources: false, prompts: true },
          tools: [{ name: 'tool' }],
          prompts: [{ name: 'prompt' }],
          resources: [], // Disabled, so empty is OK
        });
      }).not.toThrow();
    });
  });
});
