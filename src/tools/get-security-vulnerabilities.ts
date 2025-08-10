import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SonarQubeClient } from '../services/sonarqube-client.js';
import { SecurityVulnerability } from '../types/sonarqube.js';
import { formatSeverity } from '../utils/formatting.js';

// Input schema for getting security vulnerabilities
const GetSecurityVulnerabilitiesSchema = z.object({
  projectKey: z.string().describe('The SonarQube project key'),
  branch: z.string().optional().describe('Branch name (optional, defaults to main branch)'),
  severities: z.string().optional().describe('Comma-separated severities (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)'),
  statuses: z.string().optional().describe('Comma-separated statuses (OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED)'),
  assigned: z.boolean().optional().describe('Filter by assigned/unassigned vulnerabilities'),
  limit: z.number().optional().default(50).describe('Maximum number of vulnerabilities to return (default: 50)'),
});

export const getSecurityVulnerabilitiesTool: Tool = {
  name: 'get_security_vulnerabilities',
  description: 'Get detailed security vulnerability analysis from a SonarQube project',
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
      severities: {
        type: 'string',
        description: 'Comma-separated severities (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)'
      },
      statuses: {
        type: 'string',
        description: 'Comma-separated statuses (OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED)'
      },
      assigned: {
        type: 'boolean',
        description: 'Filter by assigned/unassigned vulnerabilities'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of vulnerabilities to return (default: 50)',
        default: 50
      }
    },
    required: ['projectKey']
  }
};

export async function getSecurityVulnerabilitiesHandler(params: z.infer<typeof GetSecurityVulnerabilitiesSchema>) {
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
    const vulnParams: any = {
      projectKey: params.projectKey,
      ps: params.limit,
    };
    
    if (params.branch) {
      vulnParams.branch = params.branch;
    }
    if (params.severities) {
      vulnParams.severities = params.severities;
    }
    if (params.statuses) {
      vulnParams.statuses = params.statuses;
    }
    if (params.assigned !== undefined) {
      vulnParams.assigned = params.assigned;
    }
    
    const vulnResponse = await client.getSecurityVulnerabilities(vulnParams);
    
    if (!vulnResponse.vulnerabilities || vulnResponse.vulnerabilities.length === 0) {
      return `No security vulnerabilities found for project "${params.projectKey}"${params.branch ? ` on branch "${params.branch}"` : ''}.`;
    }
    
    // Format the vulnerabilities data
    let output = `## Security Vulnerabilities for Project: ${params.projectKey}\n\n`;
    
    if (params.branch) {
      output += `**Branch:** ${params.branch}\n`;
    }
    
    output += `**Total Vulnerabilities:** ${vulnResponse.vulnerabilities.length}\n`;
    output += `**Showing:** ${vulnResponse.vulnerabilities.length} vulnerabilities\n\n`;
    
    // Group vulnerabilities by severity
    const vulnBySeverity = vulnResponse.vulnerabilities.reduce((acc: Record<string, SecurityVulnerability[]>, vuln) => {
      const severity = vuln.severity || 'UNKNOWN';
      if (!acc[severity]) {
        acc[severity] = [];
      }
      acc[severity].push(vuln);
      return acc;
    }, {});
    
    // Display vulnerabilities by severity (most critical first)
    const severityOrder = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO', 'UNKNOWN'];
    
    for (const severity of severityOrder) {
      const vulns = vulnBySeverity[severity];
      if (!vulns || vulns.length === 0) continue;
      
      output += `### ${formatSeverity(severity)} (${vulns.length})\n\n`;
      
      for (const vuln of vulns) {
        const status = vuln.status || 'Unknown';
        const component = vuln.component || 'Unknown';
        const line = vuln.line ? `:${vuln.line}` : '';
        const assignee = vuln.assignee || 'Unassigned';
        const creationDate = vuln.creationDate ? new Date(vuln.creationDate).toLocaleDateString() : 'Unknown';
        const updateDate = vuln.updateDate ? new Date(vuln.updateDate).toLocaleDateString() : 'Unknown';
        
        output += `**${status}** | ${component}${line}\n`;
        output += `- **Message:** ${vuln.message || 'No message'}\n`;
        output += `- **Rule:** ${vuln.rule || 'Unknown'}\n`;
        output += `- **Type:** ${vuln.type || 'Unknown'}\n`;
        output += `- **Assignee:** ${assignee}\n`;
        output += `- **Created:** ${creationDate}\n`;
        output += `- **Updated:** ${updateDate}\n`;
        
        if (vuln.tags && vuln.tags.length > 0) {
          output += `- **Tags:** ${vuln.tags.join(', ')}\n`;
        }
        
        if (vuln.effort) {
          output += `- **Effort to Fix:** ${vuln.effort}\n`;
        }
        
        if (vuln.author) {
          output += `- **Author:** ${vuln.author}\n`;
        }
        
        output += '\n';
      }
    }
    
    // Add security hotspots if available
    if (vulnResponse.hotspots && vulnResponse.hotspots.length > 0) {
      output += `### Security Hotspots (${vulnResponse.hotspots.length})\n\n`;
      output += `Security hotspots require manual review to determine if they are actual vulnerabilities.\n\n`;
      
      for (const hotspot of vulnResponse.hotspots) {
        const status = hotspot.status || 'Unknown';
        const component = hotspot.component || 'Unknown';
        const line = hotspot.line ? `:${hotspot.line}` : '';
        const securityCategory = hotspot.securityCategory || 'Unknown';
        
        output += `**${status}** | ${component}${line}\n`;
        output += `- **Message:** ${hotspot.message || 'No message'}\n`;
        output += `- **Security Category:** ${securityCategory}\n`;
        output += `- **Rule:** ${hotspot.rule || 'Unknown'}\n`;
        
        if (hotspot.vulnerabilityProbability) {
          output += `- **Vulnerability Probability:** ${hotspot.vulnerabilityProbability}\n`;
        }
        
        output += '\n';
      }
    }
    
    // Add summary statistics
    const totalCritical = (vulnBySeverity['BLOCKER']?.length || 0) + (vulnBySeverity['CRITICAL']?.length || 0);
    const totalMajor = vulnBySeverity['MAJOR']?.length || 0;
    const totalMinor = vulnBySeverity['MINOR']?.length || 0;
    
    output += `### Security Summary\n\n`;
    output += `- **Critical Issues (Blocker + Critical):** ${totalCritical}\n`;
    output += `- **Major Issues:** ${totalMajor}\n`;
    output += `- **Minor Issues:** ${totalMinor}\n`;
    output += `- **Security Hotspots:** ${vulnResponse.hotspots?.length || 0}\n\n`;
    
    // Add risk assessment
    output += `### Risk Assessment\n\n`;
    if (totalCritical > 0) {
      output += `🚨 **HIGH RISK**: ${totalCritical} critical security vulnerabilities need immediate attention.\n`;
    } else if (totalMajor > 0) {
      output += `⚠️ **MEDIUM RISK**: ${totalMajor} major security vulnerabilities should be addressed soon.\n`;
    } else if (totalMinor > 0) {
      output += `ℹ️ **LOW RISK**: ${totalMinor} minor security vulnerabilities for future consideration.\n`;
    } else {
      output += `✅ **LOW RISK**: No security vulnerabilities found.\n`;
    }
    
    // Add recommendations
    output += `\n### Recommendations\n\n`;
    if (totalCritical > 0) {
      output += `1. **Immediate Action Required**: Address all BLOCKER and CRITICAL vulnerabilities\n`;
      output += `2. **Security Review**: Conduct thorough security assessment\n`;
      output += `3. **Patch Management**: Update dependencies and libraries\n`;
    }
    if (vulnResponse.hotspots && vulnResponse.hotspots.length > 0) {
      output += `4. **Manual Review**: Examine security hotspots to determine actual risk\n`;
    }
    output += `5. **Continuous Monitoring**: Set up automated security scanning in CI/CD\n`;
    output += `6. **Developer Training**: Ensure team is aware of secure coding practices\n`;
    
    // Add filtering info
    const activeFilters = [];
    if (params.severities) activeFilters.push(`Severities: ${params.severities}`);
    if (params.statuses) activeFilters.push(`Statuses: ${params.statuses}`);
    if (params.assigned !== undefined) activeFilters.push(`Assigned: ${params.assigned ? 'Yes' : 'No'}`);
    
    if (activeFilters.length > 0) {
      output += `\n### Active Filters\n${activeFilters.map(f => `- ${f}`).join('\n')}\n`;
    }
    
    return output;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Error getting security vulnerabilities: ${errorMessage}`;
  }
}
