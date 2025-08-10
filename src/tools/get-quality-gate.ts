import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SonarQubeClient } from '../services/sonarqube-client.js';

// Input schema for getting quality gate status
const GetQualityGateSchema = z.object({
  projectKey: z.string().describe('The SonarQube project key'),
  branch: z.string().optional().describe('Branch name (optional, defaults to main branch)'),
});

export const getQualityGateTool: Tool = {
  name: 'get_quality_gate',
  description: 'Get quality gate status and conditions for a SonarQube project',
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
      }
    },
    required: ['projectKey']
  }
};

export async function getQualityGateHandler(params: z.infer<typeof GetQualityGateSchema>) {
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
    const qualityGateParams: any = {
      projectKey: params.projectKey,
    };
    
    if (params.branch) {
      qualityGateParams.branch = params.branch;
    }
    
    const qualityGate = await client.getQualityGate(qualityGateParams);
    
    // Format the quality gate data
    let output = `## Quality Gate Status for Project: ${params.projectKey}\n\n`;
    
    if (params.branch) {
      output += `**Branch:** ${params.branch}\n`;
    }
    
    // Overall status with emoji
    const statusEmoji = getStatusEmoji(qualityGate.status);
    const statusColor = getStatusColor(qualityGate.status);
    
    output += `### Overall Status: ${statusEmoji} **${qualityGate.status}**\n\n`;
    
    if (qualityGate.status === 'OK') {
      output += `✅ **Congratulations!** This project meets all quality gate requirements.\n\n`;
    } else if (qualityGate.status === 'WARN') {
      output += `⚠️ **Warning:** This project has some quality gate conditions that need attention.\n\n`;
    } else {
      output += `❌ **Failed:** This project does not meet the quality gate requirements.\n\n`;
    }
    
    // Quality gate conditions
    if (qualityGate.conditions && qualityGate.conditions.length > 0) {
      output += `### Quality Gate Conditions (${qualityGate.conditions.length})\n\n`;
      
      // Group conditions by status
      const passedConditions = qualityGate.conditions.filter(c => c.status === 'OK');
      const warningConditions = qualityGate.conditions.filter(c => c.status === 'WARN');
      const failedConditions = qualityGate.conditions.filter(c => c.status === 'ERROR');
      
      // Show failed conditions first
      if (failedConditions.length > 0) {
        output += `#### ❌ Failed Conditions (${failedConditions.length})\n\n`;
        for (const condition of failedConditions) {
          output += formatCondition(condition, 'FAILED');
        }
        output += '\n';
      }
      
      // Show warning conditions
      if (warningConditions.length > 0) {
        output += `#### ⚠️ Warning Conditions (${warningConditions.length})\n\n`;
        for (const condition of warningConditions) {
          output += formatCondition(condition, 'WARNING');
        }
        output += '\n';
      }
      
      // Show passed conditions
      if (passedConditions.length > 0) {
        output += `#### ✅ Passed Conditions (${passedConditions.length})\n\n`;
        for (const condition of passedConditions) {
          output += formatCondition(condition, 'PASSED');
        }
        output += '\n';
      }
      
      // Summary statistics
      output += `### Condition Summary\n\n`;
      output += `- **Passed:** ${passedConditions.length}\n`;
      output += `- **Warnings:** ${warningConditions.length}\n`;
      output += `- **Failed:** ${failedConditions.length}\n`;
      output += `- **Total:** ${qualityGate.conditions.length}\n\n`;
      
    } else {
      output += `### Quality Gate Conditions\n\nNo specific conditions configured for this quality gate.\n\n`;
    }
    
    // Recommendations based on status
    output += `### Recommendations\n\n`;
    
    if (qualityGate.status === 'ERROR') {
      output += `**Critical Actions Required:**\n`;
      output += `1. 🎯 **Focus on Failed Conditions**: Address all red conditions immediately\n`;
      output += `2. 🔍 **Code Review**: Conduct thorough review of new/changed code\n`;
      output += `3. 🧪 **Testing**: Ensure adequate test coverage for new code\n`;
      output += `4. 🐛 **Bug Fixes**: Resolve critical and major bugs\n`;
      output += `5. 🔒 **Security**: Address any security vulnerabilities\n\n`;
    } else if (qualityGate.status === 'WARN') {
      output += `**Improvement Actions:**\n`;
      output += `1. ⚠️ **Address Warnings**: Work on warning conditions to prevent future failures\n`;
      output += `2. 📈 **Continuous Improvement**: Implement better coding practices\n`;
      output += `3. 📊 **Monitor Trends**: Keep an eye on quality metrics trends\n\n`;
    } else {
      output += `**Maintenance Actions:**\n`;
      output += `1. 🎉 **Great work!** Keep maintaining high code quality standards\n`;
      output += `2. 📊 **Monitor**: Continue tracking quality metrics\n`;
      output += `3. 🔄 **Consistency**: Ensure new code continues to meet standards\n\n`;
    }
    
    // Next steps
    output += `### Next Steps\n\n`;
    output += `- Use \`list_issues\` tool to see detailed issues affecting quality gate\n`;
    output += `- Use \`get_project_metrics\` tool for comprehensive project metrics\n`;
    output += `- Use \`get_security_vulnerabilities\` tool for security-specific analysis\n`;
    output += `- Use \`get_analysis_history\` tool to see quality trends over time\n`;
    
    return output;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Error getting quality gate status: ${errorMessage}`;
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'OK':
      return '✅';
    case 'WARN':
      return '⚠️';
    case 'ERROR':
      return '❌';
    default:
      return '❓';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'OK':
      return 'green';
    case 'WARN':
      return 'orange';
    case 'ERROR':
      return 'red';
    default:
      return 'gray';
  }
}

function formatCondition(condition: any, type: 'PASSED' | 'WARNING' | 'FAILED'): string {
  const emoji = type === 'PASSED' ? '✅' : type === 'WARNING' ? '⚠️' : '❌';
  const metricName = formatMetricName(condition.metricKey || condition.metric || 'Unknown');
  const operator = formatOperator(condition.comparator || condition.operator);
  const threshold = condition.errorThreshold || condition.threshold || 'N/A';
  const actualValue = condition.actualValue || condition.value || 'N/A';
  
  let output = `${emoji} **${metricName}**\n`;
  output += `  - **Condition:** ${operator} ${threshold}\n`;
  output += `  - **Actual Value:** ${actualValue}\n`;
  
  if (condition.period) {
    output += `  - **Period:** ${condition.period}\n`;
  }
  
  output += '\n';
  return output;
}

function formatMetricName(metricKey: string): string {
  const metricNames: Record<string, string> = {
    'new_coverage': 'New Code Coverage',
    'coverage': 'Overall Coverage',
    'new_duplicated_lines_density': 'New Code Duplication',
    'duplicated_lines_density': 'Overall Duplication',
    'new_maintainability_rating': 'New Code Maintainability',
    'maintainability_rating': 'Overall Maintainability',
    'new_reliability_rating': 'New Code Reliability',
    'reliability_rating': 'Overall Reliability',
    'new_security_rating': 'New Code Security',
    'security_rating': 'Overall Security',
    'new_security_hotspots_reviewed': 'New Security Hotspots Reviewed',
    'security_hotspots_reviewed': 'Security Hotspots Reviewed',
    'new_bugs': 'New Bugs',
    'bugs': 'Total Bugs',
    'new_vulnerabilities': 'New Vulnerabilities',
    'vulnerabilities': 'Total Vulnerabilities',
    'new_code_smells': 'New Code Smells',
    'code_smells': 'Total Code Smells',
    'new_lines_to_cover': 'New Lines to Cover',
    'lines_to_cover': 'Total Lines to Cover',
  };
  
  return metricNames[metricKey] || metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatOperator(operator: string): string {
  switch (operator) {
    case 'GT':
      return 'is greater than';
    case 'LT':
      return 'is less than';
    case 'GTE':
      return 'is greater than or equal to';
    case 'LTE':
      return 'is less than or equal to';
    case 'EQ':
      return 'equals';
    case 'NE':
      return 'does not equal';
    default:
      return operator;
  }
}
