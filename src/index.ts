#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SonarQubeClient } from './services/sonarqube-client.js';

// Import tool definitions
import { 
  listProjectsTool, 
  listProjects 
} from './tools/list-projects.js';

import { 
  getProjectMetricsTool, 
  getProjectMetrics 
} from './tools/get-project-metrics.js';

import { 
  listIssuesTool, 
  listIssuesHandler 
} from './tools/list-issues.js';

import { 
  getSecurityVulnerabilitiesTool, 
  getSecurityVulnerabilitiesHandler 
} from './tools/get-security-vulnerabilities.js';

import { 
  getQualityGateTool, 
  getQualityGateHandler 
} from './tools/get-quality-gate.js';

import { 
  getAnalysisHistoryTool, 
  getAnalysisHistoryHandler 
} from './tools/get-analysis-history.js';

import { 
  getProjectRepositoryTool, 
  getProjectRepositoryHandler 
} from './tools/get-project-repository.js';

// Create server instance
const server = new Server(
  {
    name: 'sonarqube-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to create SonarQube client
function createSonarQubeClient(): SonarQubeClient {
  const config = {
    baseUrl: process.env.SONARQUBE_URL || 'http://localhost:9000',
    token: process.env.SONARQUBE_TOKEN || '',
  };
  
  if (!config.token) {
    throw new Error('SONARQUBE_TOKEN environment variable is required');
  }
  
  return new SonarQubeClient(config);
}

// List of all available tools
const tools = [
  listProjectsTool,
  getProjectMetricsTool,
  listIssuesTool,
  getSecurityVulnerabilitiesTool,
  getQualityGateTool,
  getAnalysisHistoryTool,
  getProjectRepositoryTool,
];

// Handler for tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools,
  };
});

// Handler for tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'sonarqube_list_projects': {
        const client = createSonarQubeClient();
        const result = await listProjects(client, args || {});
        return {
          content: [
            {
              type: 'text',
              text: result.content,
            },
          ],
        };
      }

      case 'sonarqube_get_project_metrics': {
        if (!args) {
          throw new Error('Arguments required for sonarqube_get_project_metrics');
        }
        const client = createSonarQubeClient();
        const result = await getProjectMetrics(client, args);
        return {
          content: [
            {
              type: 'text',
              text: result.content,
            },
          ],
        };
      }

      case 'list_issues': {
        if (!args) {
          throw new Error('Arguments required for list_issues');
        }
        const result = await listIssuesHandler(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_security_vulnerabilities': {
        if (!args) {
          throw new Error('Arguments required for get_security_vulnerabilities');
        }
        const result = await getSecurityVulnerabilitiesHandler(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_quality_gate': {
        if (!args) {
          throw new Error('Arguments required for get_quality_gate');
        }
        const result = await getQualityGateHandler(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_analysis_history': {
        if (!args) {
          throw new Error('Arguments required for get_analysis_history');
        }
        const result = await getAnalysisHistoryHandler(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      case 'get_project_repository': {
        if (!args) {
          throw new Error('Arguments required for get_project_repository');
        }
        const result = await getProjectRepositoryHandler(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool "${name}": ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Error handling
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log server start (to stderr so it doesn't interfere with stdio)
    console.error('SonarQube MCP Server started successfully');
    console.error('Available tools:', tools.map(t => t.name).join(', '));
    
  } catch (error) {
    console.error('Failed to start SonarQube MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

// Start the server - always start when this file is executed
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
