import { z } from 'zod';
import { SonarQubeClient } from '../services/sonarqube-client.js';
import { ToolResponse } from '../types/sonarqube.js';
import { 
  formatNumber, 
  formatDuration,
  parseTechnicalDebt,
  getRatingColor,
  formatMetricName,
  createAnalysisSummary,
  generateRecommendations,
  isValidProjectKey
} from '../utils/formatting.js';

// Input validation schema
const GetProjectMetricsSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  branch: z.string().optional(),
  metrics: z.string().optional(),
});

/**
 * Get comprehensive project quality metrics
 */
export async function getProjectMetrics(
  client: SonarQubeClient,
  args: unknown
): Promise<ToolResponse> {
  try {
    // Validate input parameters
    const params = GetProjectMetricsSchema.parse(args || {});
    
    // Validate project key format
    if (!isValidProjectKey(params.projectKey)) {
      return {
        content: [{
          type: 'text',
          text: `Invalid project key format: "${params.projectKey}". Project keys should contain only letters, digits, hyphens, underscores, periods, and colons.`
        }],
        isError: true,
      };
    }

    // Fetch project metrics from SonarQube
    const metricsParams: any = {
      projectKey: params.projectKey,
    };
    if (params.branch) {
      metricsParams.branch = params.branch;
    }
    if (params.metrics) {
      metricsParams.metrics = params.metrics;
    }
    
    const metrics = await client.getProjectMetrics(metricsParams);

    // Also get quality gate status
    const qualityGateParams: any = {
      projectKey: params.projectKey,
    };
    if (params.branch) {
      qualityGateParams.branch = params.branch;
    }
    
    const qualityGate = await client.getQualityGate(qualityGateParams);

    // Extract and format key metrics
    const {
      ncloc = 0,
      complexity = 0,
      coverage = 0,
      duplicated_lines_density = 0,
      bugs = 0,
      vulnerabilities = 0,
      code_smells = 0,
      technical_debt = '0min',
      sqale_rating = 'A',
      reliability_rating = 'A',
      security_rating = 'A',
      maintainability_rating = 'A',
      sqale_debt_ratio = 0,
    } = metrics.metrics;

    // Parse technical debt for analysis
    const technicalDebtMinutes = typeof technical_debt === 'string' 
      ? parseTechnicalDebt(technical_debt) 
      : 0;

    // Create formatted response
    let response = `📊 **Quality Metrics for ${params.projectKey}**\n`;
    
    if (params.branch) {
      response += `🌿 Branch: ${params.branch}\n`;
    }
    
    response += '\n';

    // Quality Gate Status
    response += `🎯 **Quality Gate:** ${qualityGate.status === 'OK' ? '✅ PASSED' : qualityGate.status === 'ERROR' ? '❌ FAILED' : '⚠️ WARNING'}\n`;
    
    if (qualityGate.conditions.length > 0) {
      response += `\n**Quality Gate Conditions:**\n`;
      qualityGate.conditions.forEach(condition => {
        const status = condition.status === 'OK' ? '✅' : '❌';
        const operator = condition.operator === 'LT' ? '<' : condition.operator === 'GT' ? '>' : condition.operator;
        response += `• ${status} ${formatMetricName(condition.metric)}: ${condition.actualValue || 'N/A'} ${operator} ${condition.threshold}\n`;
      });
    }

    // Overall Health Summary
    response += `\n📈 **Overall Health:**\n`;
    response += `• ${getRatingColor(String(maintainability_rating))} Maintainability: ${maintainability_rating}\n`;
    response += `• ${getRatingColor(String(reliability_rating))} Reliability: ${reliability_rating}\n`;
    response += `• ${getRatingColor(String(security_rating))} Security: ${security_rating}\n`;

    // Key Metrics
    response += `\n📊 **Key Metrics:**\n`;
    response += `• 📏 Lines of Code: ${formatNumber(Number(ncloc))}\n`;
    response += `• 🔄 Complexity: ${formatNumber(Number(complexity))}\n`;
    response += `• 🧪 Test Coverage: ${Number(coverage).toFixed(1)}%\n`;
    response += `• 📋 Code Duplication: ${Number(duplicated_lines_density).toFixed(1)}%\n`;
    response += `• ⚠️ Technical Debt: ${technical_debt}\n`;
    response += `• 📊 Debt Ratio: ${Number(sqale_debt_ratio).toFixed(1)}%\n`;

    // Issues Summary
    const totalIssues = Number(bugs) + Number(vulnerabilities) + Number(code_smells);
    response += `\n🐛 **Issues Summary:**\n`;
    response += `• 🐛 Bugs: ${bugs}\n`;
    response += `• 🔒 Vulnerabilities: ${vulnerabilities}\n`;
    response += `• 👃 Code Smells: ${code_smells}\n`;
    response += `• 📊 Total Issues: ${totalIssues}\n`;

    // Detailed Metrics (if available)
    const otherMetrics = Object.entries(metrics.metrics).filter(([key]) => 
      !['ncloc', 'complexity', 'coverage', 'duplicated_lines_density', 'bugs', 
        'vulnerabilities', 'code_smells', 'technical_debt', 'sqale_rating', 
        'reliability_rating', 'security_rating', 'maintainability_rating', 
        'sqale_debt_ratio'].includes(key)
    );

    if (otherMetrics.length > 0) {
      response += `\n📈 **Additional Metrics:**\n`;
      otherMetrics.forEach(([key, value]) => {
        response += `• ${formatMetricName(key)}: ${value}\n`;
      });
    }

    // Generate Analysis Summary
    const summaryData = {
      projectName: params.projectKey,
      totalIssues,
      criticalIssues: Number(bugs) + Number(vulnerabilities),
      coverage: Number(coverage),
      duplications: Number(duplicated_lines_density),
      technicalDebt: String(technical_debt),
      qualityGate: qualityGate.status,
    };

    response += `\n${createAnalysisSummary(summaryData)}\n`;

    // Generate Recommendations
    const recommendations = generateRecommendations({
      coverage: Number(coverage),
      duplications: Number(duplicated_lines_density),
      criticalIssues: Number(bugs) + Number(vulnerabilities),
      vulnerabilities: Number(vulnerabilities),
      technicalDebtMinutes,
    });

    if (recommendations.length > 0) {
      response += `\n💡 **Recommendations:**\n`;
      recommendations.forEach(rec => {
        response += `• ${rec}\n`;
      });
    }

    // Next Steps
    response += `\n🔍 **Next Steps:**\n`;
    response += `• Use "sonarqube_list_issues" to see detailed issue breakdown\n`;
    
    if (Number(vulnerabilities) > 0) {
      response += `• Use "sonarqube_get_security_vulnerabilities" for security analysis\n`;
    }
    
    response += `• Use "sonarqube_get_quality_gate" for quality gate details\n`;
    response += `• Use "sonarqube_get_project_analysis_history" for trend analysis\n`;

    return {
      content: [{ type: 'text', text: response }],
    };

  } catch (error) {
    console.error('Error in getProjectMetrics:', error);
    
    let errorMessage = 'Error retrieving project metrics';
    
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        errorMessage = `Project "${(args as any)?.projectKey || 'unknown'}" not found. Please check the project key.`;
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Access denied. Please check your SonarQube authentication and permissions.';
      } else {
        errorMessage = `Error retrieving project metrics: ${error.message}`;
      }
    }
    
    return {
      content: [{ type: 'text', text: errorMessage }],
      isError: true,
    };
  }
}

/**
 * Tool definition for MCP server
 */
export const getProjectMetricsTool = {
  name: 'sonarqube_get_project_metrics',
  description: 'Retrieve comprehensive project quality metrics including coverage, technical debt, complexity, and issue counts',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'SonarQube project key (required)',
      },
      branch: {
        type: 'string',
        description: 'Specific branch to analyze (optional, defaults to main branch)',
      },
      metrics: {
        type: 'string',
        description: 'Comma-separated list of specific metrics to retrieve (optional, defaults to standard quality metrics)',
      },
    },
    required: ['projectKey'],
    additionalProperties: false,
  },
};
