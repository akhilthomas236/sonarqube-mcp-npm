import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SonarQubeClient } from '../services/sonarqube-client.js';
import { SonarQubeIssue } from '../types/sonarqube.js';
import { formatIssueType, formatSeverity } from '../utils/formatting.js';

// Input schema for listing SonarQube issues
const ListIssuesSchema = z.object({
  projectKey: z.string().describe('The SonarQube project key'),
  branch: z.string().optional().describe('Branch name (optional, defaults to main branch)'),
  types: z.string().optional().describe('Comma-separated issue types (BUG, VULNERABILITY, CODE_SMELL)'),
  severities: z.string().optional().describe('Comma-separated severities (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)'),
  statuses: z.string().optional().describe('Comma-separated statuses (OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED)'),
  assignees: z.string().optional().describe('Comma-separated assignee usernames'),
  tags: z.string().optional().describe('Comma-separated tags'),
  limit: z.number().optional().default(50).describe('Maximum number of issues to return (default: 50)'),
});

export const listIssuesTool: Tool = {
  name: 'list_issues',
  description: 'List code quality issues from a SonarQube project with filtering options',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'The SonarQube project key'
      },
      branch: {
        type: 'string',
        description: 'Branch name (optional, defaults to main branch)'
      },
      types: {
        type: 'string',
        description: 'Comma-separated issue types (BUG, VULNERABILITY, CODE_SMELL)'
      },
      severities: {
        type: 'string',
        description: 'Comma-separated severities (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)'
      },
      statuses: {
        type: 'string',
        description: 'Comma-separated statuses (OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED)'
      },
      assignees: {
        type: 'string',
        description: 'Comma-separated assignee usernames'
      },
      tags: {
        type: 'string',
        description: 'Comma-separated tags'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of issues to return (default: 50)',
        default: 50
      }
    },
    required: ['projectKey']
  }
};

export async function listIssuesHandler(params: z.infer<typeof ListIssuesSchema>) {
  try {
    // Get SonarQube configuration from environment
    const config = {
      baseUrl: process.env.SONARQUBE_URL || 'http://localhost:9000',
      token: process.env.SONARQUBE_TOKEN || '',
    };
    
    if (!config.token) {
      throw new Error('SONARQUBE_TOKEN environment variable is required');
    }
    
    const client = new SonarQubeClient(config);
    
    // Build parameters object
    const issuesParams: any = {
      componentKeys: params.projectKey,
      ps: params.limit,
    };
    
    if (params.branch) {
      issuesParams.branch = params.branch;
    }
    if (params.types) {
      issuesParams.types = params.types;
    }
    if (params.severities) {
      issuesParams.severities = params.severities;
    }
    if (params.statuses) {
      issuesParams.statuses = params.statuses;
    }
    if (params.assignees) {
      issuesParams.assignees = params.assignees;
    }
    if (params.tags) {
      issuesParams.tags = params.tags;
    }
    
    const issuesResponse = await client.listIssues(issuesParams);
    
    if (!issuesResponse.issues || issuesResponse.issues.length === 0) {
      return `No issues found for project "${params.projectKey}"${params.branch ? ` on branch "${params.branch}"` : ''}.`;
    }
    
    // Format the issues data
    let output = `## Issues for Project: ${params.projectKey}\n\n`;
    
    if (params.branch) {
      output += `**Branch:** ${params.branch}\n`;
    }
    
    output += `**Total Issues:** ${issuesResponse.paging.total}\n`;
    output += `**Showing:** ${issuesResponse.issues.length} issues\n\n`;
    
    // Group issues by type
    const issuesByType = issuesResponse.issues.reduce((acc: Record<string, SonarQubeIssue[]>, issue) => {
      const type = issue.type || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(issue);
      return acc;
    }, {});
    
    // Display issues by type
    for (const [type, issues] of Object.entries(issuesByType)) {
      output += `### ${formatIssueType(type)} (${issues.length})\n\n`;
      
      for (const issue of issues) {
        const severity = issue.severity ? formatSeverity(issue.severity) : 'Unknown';
        const status = issue.status || 'Unknown';
        const component = issue.component || 'Unknown';
        const line = issue.line ? `:${issue.line}` : '';
        const assignee = issue.assignee || 'Unassigned';
        const creationDate = issue.creationDate ? new Date(issue.creationDate).toLocaleDateString() : 'Unknown';
        
        output += `**${severity}** | **${status}** | ${component}${line}\n`;
        output += `- **Message:** ${issue.message || 'No message'}\n`;
        output += `- **Rule:** ${issue.rule || 'Unknown'}\n`;
        output += `- **Assignee:** ${assignee}\n`;
        output += `- **Created:** ${creationDate}\n`;
        
        if (issue.tags && issue.tags.length > 0) {
          output += `- **Tags:** ${issue.tags.join(', ')}\n`;
        }
        
        if (issue.effort) {
          output += `- **Effort:** ${issue.effort}\n`;
        }
        
        output += '\n';
      }
    }
    
    // Add summary by severity
    const severityCounts = issuesResponse.issues.reduce((acc: Record<string, number>, issue) => {
      const severity = issue.severity || 'UNKNOWN';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
    
    output += `### Summary by Severity\n\n`;
    for (const [severity, count] of Object.entries(severityCounts)) {
      output += `- **${formatSeverity(severity)}:** ${count}\n`;
    }
    
    // Add filtering info
    const activeFilters = [];
    if (params.types) activeFilters.push(`Types: ${params.types}`);
    if (params.severities) activeFilters.push(`Severities: ${params.severities}`);
    if (params.statuses) activeFilters.push(`Statuses: ${params.statuses}`);
    if (params.assignees) activeFilters.push(`Assignees: ${params.assignees}`);
    if (params.tags) activeFilters.push(`Tags: ${params.tags}`);
    
    if (activeFilters.length > 0) {
      output += `\n### Active Filters\n${activeFilters.map(f => `- ${f}`).join('\n')}\n`;
    }
    
    // Add next steps
    output += `\n### Next Steps\n`;
    output += `- Focus on **BLOCKER** and **CRITICAL** severity issues first\n`;
    output += `- Review **BUG** and **VULNERABILITY** types with high priority\n`;
    output += `- Consider assigning unassigned issues to team members\n`;
    output += `- Use \`get_security_vulnerabilities\` tool for detailed security analysis\n`;
    
    return output;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Error listing issues: ${errorMessage}`;
  }
}
