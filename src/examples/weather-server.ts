/**
 * Weather Server Example
 *
 * Demonstrates a tools-focused MCP server that integrates with external APIs.
 * This example shows:
 * - Tool definitions with proper schemas
 * - External API integration patterns
 * - Error handling and validation
 * - Rate limiting for API calls
 */

import type { ServerConfig } from '../generator/types.js';

export const weatherServerConfig: ServerConfig = {
  name: 'weather-server',
  description: 'MCP server providing weather information and forecasts',
  type: 'tools',
  outputDir: './generated-servers',
  skipInstall: false,

  capabilities: {
    tools: true,
    resources: false,
    prompts: false
  },

  features: {
    listChanged: false,
    subscribe: false,
    structuredOutputs: true
  },

  includeExamples: true,
  includeTests: true,

  security: {
    validateInputs: true,
    sanitizePaths: false, // No file operations
    rateLimit: true // Important for external API calls
  }
};

/**
 * Example tool definitions for weather server
 */
export const weatherTools = [
  {
    name: 'get_current_weather',
    title: 'Get Current Weather',
    description: 'Get current weather conditions for a location',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name, state code, and country code (e.g., "London,GB" or "New York,NY,US")'
        },
        units: {
          type: 'string',
          enum: ['metric', 'imperial'],
          description: 'Units of measurement (metric for Celsius, imperial for Fahrenheit)',
          default: 'metric'
        }
      },
      required: ['location']
    },
    outputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string' },
        temperature: { type: 'number' },
        condition: { type: 'string' },
        humidity: { type: 'number' },
        wind_speed: { type: 'number' },
        timestamp: { type: 'string' }
      }
    },
    annotations: {
      title: 'Current Weather',
      readOnlyHint: true,
      openWorldHint: true // Makes external API calls
    }
  },
  {
    name: 'get_forecast',
    title: 'Get Weather Forecast',
    description: 'Get weather forecast for the next 5 days',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name, state code, and country code'
        },
        days: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Number of days to forecast (1-5)',
          default: 3
        },
        units: {
          type: 'string',
          enum: ['metric', 'imperial'],
          default: 'metric'
        }
      },
      required: ['location']
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true
    }
  }
];

/**
 * Usage instructions for weather server
 */
export const weatherServerReadme = `
## Weather Server

This server provides weather information through MCP tools.

### Prerequisites

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Set the environment variable: \`export OPENWEATHER_API_KEY=your_key_here\`

### Tools

#### get_current_weather
Get real-time weather conditions for any location.

**Example:**
\`\`\`json
{
  "name": "get_current_weather",
  "arguments": {
    "location": "San Francisco,CA,US",
    "units": "imperial"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "location": "San Francisco, CA, US",
  "temperature": 62.5,
  "condition": "Partly Cloudy",
  "humidity": 75,
  "wind_speed": 12.3,
  "timestamp": "2025-01-10T12:00:00Z"
}
\`\`\`

#### get_forecast
Get multi-day weather forecast.

**Example:**
\`\`\`json
{
  "name": "get_forecast",
  "arguments": {
    "location": "London,GB",
    "days": 5,
    "units": "metric"
  }
}
\`\`\`

### Rate Limiting

This server implements rate limiting to respect API quotas:
- Maximum 60 requests per minute per location
- Automatic caching of responses for 10 minutes

### Error Handling

The server handles common errors gracefully:
- Invalid location names
- API key issues
- Network timeouts
- Rate limit exceeded

All errors return structured responses with actionable guidance.
`;
