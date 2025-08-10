import { z } from 'zod';
import { SonarQubeClient } from '../services/sonarqube-client.js';
import { ProjectListResponse, ToolResponse } from '../types/sonarqube.js';
import { 
  formatNumber, 
  getStatusEmoji, 
  getRatingColor,
  createAnalysisSummary 
} from '../utils/formatting.js';

// Input validation schema
const ListProjectsSchema = z.object({
  organization: z.string().optional(),
  search: z.string().optional(),
  qualityGate: z.string().optional(),
});

/**
 * List all accessible SonarQube projects
 */
export async function listProjects(
  client: SonarQubeClient,
  args: unknown
): Promise<ToolResponse<ProjectListResponse>> {
  try {
    // Validate input parameters
    const params = ListProjectsSchema.parse(args || {});
    
    // Fetch projects from SonarQube
    const projectParams: any = {
      ps: 100, // Get up to 100 projects
    };
    
    if (params.search) {
      projectParams.search = params.search;
    }
    if (params.qualityGate) {
      projectParams.qualityGate = params.qualityGate;
    }
    if (params.organization) {
      projectParams.organization = params.organization;
    }
    
    const projects = await client.listProjects(projectParams);

    // Calculate summary statistics
    const summary = {
      totalProjects: projects.length,
      publicProjects: projects.filter(p => p.visibility === 'public').length,
      privateProjects: projects.filter(p => p.visibility === 'private').length,
      lastAnalyzed: projects.filter(p => p.lastAnalysisDate).length,
      qualityGatesPassed: projects.filter(p => p.qualityGate === 'OK').length,
      qualityGatesFailed: projects.filter(p => p.qualityGate === 'ERROR').length,
    };

    // Create formatted response
    let response = `Found ${summary.totalProjects} SonarQube projects:\n\n`;
    
    if (projects.length === 0) {
      response += 'No projects found matching your criteria.';
      
      if (params.search) {
        response += ` Try adjusting your search term: "${params.search}"`;
      }
      
      return {
        content: [{ type: 'text', text: response }],
      };
    }

    // Group projects by quality gate status for better organization
    const projectsByQualityGate = {
      OK: projects.filter(p => p.qualityGate === 'OK'),
      ERROR: projects.filter(p => p.qualityGate === 'ERROR'),
      WARN: projects.filter(p => p.qualityGate === 'WARN'),
      NONE: projects.filter(p => !p.qualityGate),
    };

    // Add summary section
    response += `📊 **Summary:**\n`;
    response += `• Total Projects: ${summary.totalProjects}\n`;
    response += `• ${getStatusEmoji('OK')} Quality Gates Passed: ${summary.qualityGatesPassed}\n`;
    response += `• ${getStatusEmoji('ERROR')} Quality Gates Failed: ${summary.qualityGatesFailed}\n`;
    response += `• 📈 Recently Analyzed: ${summary.lastAnalyzed}\n`;
    response += `• 🔓 Public: ${summary.publicProjects} | 🔒 Private: ${summary.privateProjects}\n\n`;

    // Add projects organized by quality gate status
    if (projectsByQualityGate.ERROR.length > 0) {
      response += `❌ **Projects with Quality Gate Issues (${projectsByQualityGate.ERROR.length}):**\n`;
      projectsByQualityGate.ERROR.forEach(project => {
        response += formatProjectSummary(project);
      });
      response += '\n';
    }

    if (projectsByQualityGate.WARN.length > 0) {
      response += `⚠️ **Projects with Quality Gate Warnings (${projectsByQualityGate.WARN.length}):**\n`;
      projectsByQualityGate.WARN.forEach(project => {
        response += formatProjectSummary(project);
      });
      response += '\n';
    }

    if (projectsByQualityGate.OK.length > 0) {
      response += `✅ **Projects Passing Quality Gates (${projectsByQualityGate.OK.length}):**\n`;
      projectsByQualityGate.OK.slice(0, 10).forEach(project => { // Limit to 10 for readability
        response += formatProjectSummary(project);
      });
      if (projectsByQualityGate.OK.length > 10) {
        response += `... and ${projectsByQualityGate.OK.length - 10} more projects\n`;
      }
      response += '\n';
    }

    if (projectsByQualityGate.NONE.length > 0) {
      response += `⚪ **Projects Not Yet Analyzed (${projectsByQualityGate.NONE.length}):**\n`;
      projectsByQualityGate.NONE.slice(0, 5).forEach(project => {
        response += formatProjectSummary(project);
      });
      if (projectsByQualityGate.NONE.length > 5) {
        response += `... and ${projectsByQualityGate.NONE.length - 5} more projects\n`;
      }
    }

    // Add helpful next steps
    response += `\n💡 **Next Steps:**\n`;
    response += `• Use "sonarqube_get_project_metrics" to analyze specific project quality\n`;
    response += `• Use "sonarqube_list_issues" to see detailed issues for a project\n`;
    response += `• Use "sonarqube_get_security_vulnerabilities" for security analysis\n`;

    return {
      content: [{ type: 'text', text: response }],
    };

  } catch (error) {
    console.error('Error in listProjects:', error);
    
    return {
      content: [{
        type: 'text',
        text: `Error listing projects: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true,
    };
  }
}

/**
 * Format a single project summary for display
 */
function formatProjectSummary(project: any): string {
  let summary = `• **${project.name}** (${project.key})\n`;
  
  if (project.qualityGate) {
    summary += `  ${getStatusEmoji(project.qualityGate)} Quality Gate: ${project.qualityGate}`;
  }
  
  if (project.language) {
    summary += ` | 💻 ${project.language}`;
  }
  
  if (project.visibility) {
    summary += ` | ${project.visibility === 'public' ? '🔓' : '🔒'} ${project.visibility}`;
  }
  
  if (project.lastAnalysisDate) {
    const analysisDate = new Date(project.lastAnalysisDate);
    const daysAgo = Math.floor((Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24));
    summary += ` | 📅 ${daysAgo} days ago`;
  }
  
  summary += '\n';
  
  if (project.description) {
    summary += `  📄 ${project.description}\n`;
  }
  
  return summary;
}

/**
 * Tool definition for MCP server
 */
export const listProjectsTool = {
  name: 'sonarqube_list_projects',
  description: 'List all accessible SonarQube projects with their basic information and quality status',
  inputSchema: {
    type: 'object',
    properties: {
      organization: {
        type: 'string',
        description: 'Filter projects by organization (optional)',
      },
      search: {
        type: 'string',
        description: 'Search term to filter project names (optional)',
      },
      qualityGate: {
        type: 'string',
        description: 'Filter by quality gate status: OK, WARN, ERROR (optional)',
        enum: ['OK', 'WARN', 'ERROR'],
      },
    },
    additionalProperties: false,
  },
};
