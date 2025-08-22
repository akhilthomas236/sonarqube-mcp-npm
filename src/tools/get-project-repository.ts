import { z } from 'zod';
import { SonarQubeClient } from '../services/sonarqube-client.js';
import { ProjectRepository, GetProjectRepositoryParams } from '../types/sonarqube.js';

// Tool schema definition
export const getProjectRepositoryTool = {
  name: 'get_project_repository',
  description: 'Get git repository information and source code management details for a SonarQube project',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'The SonarQube project key (required)',
      },
      includeBranches: {
        type: 'boolean',
        description: 'Include branch information in the response (optional, default: false)',
        default: false,
      },
    },
    required: ['projectKey'],
    additionalProperties: false,
  },
} as const;

// Parameter validation schema
const GetProjectRepositoryParamsSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  includeBranches: z.boolean().optional().default(false),
});

// Tool handler function
export async function getProjectRepository(
  client: SonarQubeClient, 
  params: GetProjectRepositoryParams
): Promise<{ content: string }> {
  // Validate parameters
  const validatedParams = GetProjectRepositoryParamsSchema.parse(params);
  
  try {
    const repository = await client.getProjectRepository(validatedParams);
    
    return {
      content: formatRepositoryInfo(repository),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to get repository information for project "${validatedParams.projectKey}": ${errorMessage}`);
  }
}

// Handler function for direct use
export async function getProjectRepositoryHandler(params: any): Promise<string> {
  const config = {
    baseUrl: process.env.SONARQUBE_URL || 'http://localhost:9000',
    token: process.env.SONARQUBE_TOKEN || '',
  };
  
  if (!config.token) {
    throw new Error('SONARQUBE_TOKEN environment variable is required');
  }
  
  const client = new SonarQubeClient(config);
  const result = await getProjectRepository(client, params);
  return result.content;
}

// Formatting function
function formatRepositoryInfo(repository: ProjectRepository): string {
  let output = `# Repository Information for ${repository.projectName}\n\n`;
  
  output += `**Project Key:** ${repository.projectKey}\n`;
  output += `**Project Name:** ${repository.projectName}\n\n`;
  
  if (repository.repository) {
    output += `## Source Code Repository\n\n`;
    
    if (repository.repository.url) {
      output += `**Repository URL:** ${repository.repository.url}\n`;
    }
    
    if (repository.repository.provider) {
      output += `**Provider:** ${repository.repository.provider.replace('_', ' ').toUpperCase()}\n`;
    }
    
    if (repository.repository.organization) {
      output += `**Organization:** ${repository.repository.organization}\n`;
    }
    
    if (repository.repository.name) {
      output += `**Repository Name:** ${repository.repository.name}\n`;
    }
    
    if (repository.repository.mainBranch) {
      output += `**Main Branch:** ${repository.repository.mainBranch}\n`;
    }
    
    if (repository.repository.branches && repository.repository.branches.length > 0) {
      output += `**Available Branches:**\n`;
      repository.repository.branches.forEach(branch => {
        output += `  • ${branch}\n`;
      });
    }
    
    output += `\n`;
  }
  
  if (repository.alm) {
    output += `## ALM Integration\n\n`;
    output += `**Provider:** ${repository.alm.provider}\n`;
    
    if (repository.alm.url) {
      output += `**ALM URL:** ${repository.alm.url}\n`;
    }
    
    if (repository.alm.identifier) {
      output += `**Identifier:** ${repository.alm.identifier}\n`;
    }
    
    output += `\n`;
  }
  
  if (repository.links && Object.keys(repository.links).length > 0) {
    output += `## Project Links\n\n`;
    
    if (repository.links.homepage) {
      output += `**Homepage:** ${repository.links.homepage}\n`;
    }
    
    if (repository.links.scm) {
      output += `**Source Code:** ${repository.links.scm}\n`;
    }
    
    if (repository.links.ci) {
      output += `**CI/CD:** ${repository.links.ci}\n`;
    }
    
    if (repository.links.issue) {
      output += `**Issue Tracker:** ${repository.links.issue}\n`;
    }
    
    output += `\n`;
  }
  
  if (!repository.repository && !repository.alm && (!repository.links || Object.keys(repository.links).length === 0)) {
    output += `## No Repository Information Available\n\n`;
    output += `This project may not have repository information configured in SonarQube, or the information may not be accessible with the current permissions.\n\n`;
    output += `**Possible reasons:**\n`;
    output += `• Project was analyzed without SCM integration\n`;
    output += `• Repository links are not configured in project settings\n`;
    output += `• ALM integration is not set up\n`;
    output += `• Insufficient permissions to access repository metadata\n`;
  }
  
  return output;
}
