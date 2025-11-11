import type { ServerConfig } from '../types.js';

export function generatePromptsModule(config: ServerConfig): string {
  const examplePrompt = config.includeExamples ? `
/**
 * Example prompt: analyze-data
 * Demonstrates prompt with arguments and dynamic content
 */
const analyzeDataPrompt = {
  name: 'analyze-data',
  title: 'Analyze Data',
  description: 'Generate an analysis prompt for the provided data',
  arguments: [
    {
      name: 'data',
      description: 'The data to analyze (JSON, CSV, or text)',
      required: true
    },
    {
      name: 'focus',
      description: 'What aspect to focus on (trends, anomalies, summary)',
      required: false
    }
  ]
};

async function getAnalyzeDataPrompt(args: any) {
  const data = args.data || '';
  const focus = args.focus || 'general analysis';

  return {
    description: \`Analyze the provided data with focus on \${focus}\`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: \`Please analyze the following data, focusing on \${focus}:\\n\\n\${data}\\n\\nProvide insights, patterns, and actionable recommendations.\`
        }
      }
    ]
  };
}` : '';

  return `/**
 * Prompts Module
 *
 * Implements MCP prompts following Anthropic best practices:
 * - User-controlled: triggered explicitly by user
 * - Clear arguments with descriptions
 * - Support for multi-turn sequences
 * - Can embed resources for context
 * - Dynamic content generation
 */

import type { Prompt } from '@modelcontextprotocol/sdk/types';

${examplePrompt}

/**
 * List of available prompts
 * Prompts are like slash commands or workflow templates
 */
const PROMPTS: Prompt[] = [${config.includeExamples ? '\n  analyzeDataPrompt' : ''}
  // Add more prompts here
];

/**
 * List prompts handler
 * Returns all available prompts to the client
 */
export async function listPrompts() {
  return {
    prompts: PROMPTS
  };
}

/**
 * Get prompt handler
 * Returns the actual prompt content with arguments filled in
 *
 * Best practices:
 * - Validate required arguments
 * - Generate clear, actionable prompts
 * - Can include multiple messages for multi-turn
 * - Can embed resource references
 */
export async function getPrompt(request: any) {
  const { name, arguments: args } = request.params;

  ${config.includeExamples ? `if (name === 'analyze-data') {
    return await getAnalyzeDataPrompt(args || {});
  }` : ''}

  // Prompt not found - return error response per MCP specification
  return {
    isError: true,
    content: [{
      type: 'text',
      text: \`Unknown prompt: \${name}. Available prompts: \${PROMPTS.map(p => p.name).join(', ') || 'none'}. Please use the prompts/list request to see all available prompts.\`
    }]
  };
}

/**
 * Helper: Create multi-turn prompt
 * Example of a conversation-style prompt
 */
function createMultiTurnPrompt(context: string): any {
  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'I need help with this task: ' + context
        }
      },
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: 'I\\'d be happy to help. Can you provide more details about what you\\'re trying to accomplish?'
        }
      },
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'Let me explain further...'
        }
      }
    ]
  };
}

/**
 * Helper: Embed resource in prompt
 * References a resource by URI for context
 */
function embedResource(resourceUri: string, excerpt?: string): any {
  return {
    role: 'user',
    content: {
      type: 'resource',
      resource: {
        uri: resourceUri,
        text: excerpt || 'Resource content...'
      }
    }
  };
}
`;
}
