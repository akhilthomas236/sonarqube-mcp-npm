import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SonarQubeClient } from '../services/sonarqube-client.js';
import { formatDuration } from '../utils/formatting.js';

// Input schema for getting analysis history
const GetAnalysisHistorySchema = z.object({
  projectKey: z.string().describe('The SonarQube project key'),
  branch: z.string().optional().describe('Branch name (optional, defaults to main branch)'),
  from: z.string().optional().describe('Start date for analysis history (YYYY-MM-DD format)'),
  to: z.string().optional().describe('End date for analysis history (YYYY-MM-DD format)'),
  limit: z.number().optional().default(10).describe('Maximum number of analyses to return (default: 10)'),
});

export const getAnalysisHistoryTool: Tool = {
  name: 'get_analysis_history',
  description: 'Get historical analysis data and trends for a SonarQube project',
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
      from: {
        type: 'string',
        description: 'Start date for analysis history (YYYY-MM-DD format)'
      },
      to: {
        type: 'string',
        description: 'End date for analysis history (YYYY-MM-DD format)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of analyses to return (default: 10)',
        default: 10
      }
    },
    required: ['projectKey']
  }
};

export async function getAnalysisHistoryHandler(params: z.infer<typeof GetAnalysisHistorySchema>) {
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
    const historyParams: any = {
      projectKey: params.projectKey,
      ps: params.limit,
    };
    
    if (params.branch) {
      historyParams.branch = params.branch;
    }
    if (params.from) {
      historyParams.from = params.from;
    }
    if (params.to) {
      historyParams.to = params.to;
    }
    
    const historyResponse = await client.getAnalysisHistory(historyParams);
    
    if (!historyResponse.analyses || historyResponse.analyses.length === 0) {
      return `No analysis history found for project "${params.projectKey}"${params.branch ? ` on branch "${params.branch}"` : ''}.`;
    }
    
    // Format the analysis history data
    let output = `## Analysis History for Project: ${params.projectKey}\n\n`;
    
    if (params.branch) {
      output += `**Branch:** ${params.branch}\n`;
    }
    
    const dateRange = params.from || params.to ? 
      `${params.from || 'Beginning'} to ${params.to || 'Present'}` : 
      'All Time';
    output += `**Period:** ${dateRange}\n`;
    output += `**Total Analyses:** ${historyResponse.analyses.length}\n\n`;
    
    // Recent analyses
    output += `### Recent Analyses\n\n`;
    
    for (const analysis of historyResponse.analyses.slice(0, Math.min(5, historyResponse.analyses.length))) {
      const date = new Date(analysis.date).toLocaleString();
      const projectVersion = analysis.projectVersion || 'N/A';
      const buildString = analysis.buildString || 'N/A';
      const revision = analysis.revision || 'N/A';
      
      output += `#### Analysis: ${date}\n`;
      output += `- **Project Version:** ${projectVersion}\n`;
      output += `- **Build String:** ${buildString}\n`;
      output += `- **Revision:** ${revision.substring(0, 8)}${revision.length > 8 ? '...' : ''}\n`;
      
      if (analysis.detectedCI) {
        output += `- **CI Detected:** ${analysis.detectedCI}\n`;
      }
      
      output += '\n';
    }
    
    // Get metrics trends if available
    const trendMetrics = ['bugs', 'vulnerabilities', 'code_smells', 'coverage', 'duplicated_lines_density', 'sqale_rating'];
    
    try {
      const trends = await client.getMetricTrends(
        params.projectKey, 
        trendMetrics, 
        params.from,
        params.to,
        params.branch
      );
      
      if (trends && Object.keys(trends).length > 0) {
        output += `### Quality Trends\n\n`;
        
        for (const [metricKey, trend] of Object.entries(trends)) {
          const metricName = formatMetricName(metricKey);
          const trendData = trend as any;
          
          if (trendData.history && trendData.history.length > 0) {
            const firstValue = trendData.history[0]?.value;
            const lastValue = trendData.history[trendData.history.length - 1]?.value;
            const trendDirection = getTrendDirection(firstValue, lastValue, metricKey);
            
            output += `**${metricName}:** ${trendDirection}\n`;
            output += `  - First: ${firstValue || 'N/A'}\n`;
            output += `  - Latest: ${lastValue || 'N/A'}\n`;
            output += `  - Data Points: ${trendData.history.length}\n\n`;
          }
        }
      }
    } catch (trendError) {
      console.log('Could not fetch trend data:', trendError);
    }
    
    // Analysis frequency
    if (historyResponse.analyses.length > 1) {
      const analysisFrequency = calculateAnalysisFrequency(historyResponse.analyses);
      output += `### Analysis Frequency\n\n`;
      output += `**Average time between analyses:** ${analysisFrequency}\n\n`;
    }
    
    // Project evolution summary
    output += `### Project Evolution Summary\n\n`;
    
    const firstAnalysis = historyResponse.analyses[historyResponse.analyses.length - 1];
    const latestAnalysis = historyResponse.analyses[0];
    
    if (firstAnalysis && latestAnalysis && firstAnalysis !== latestAnalysis) {
      const timeSpan = Math.floor((new Date(latestAnalysis.date).getTime() - new Date(firstAnalysis.date).getTime()) / (1000 * 60 * 60 * 24));
      output += `**Development Timespan:** ${timeSpan} days\n`;
      output += `**First Analysis:** ${new Date(firstAnalysis.date).toLocaleDateString()}\n`;
      output += `**Latest Analysis:** ${new Date(latestAnalysis.date).toLocaleDateString()}\n\n`;
    }
    
    // Project versions if available
    const versions = [...new Set(historyResponse.analyses.map(a => a.projectVersion).filter(v => v))];
    if (versions.length > 0) {
      output += `**Project Versions:** ${versions.slice(0, 10).join(', ')}${versions.length > 10 ? ' and more...' : ''}\n\n`;
    }
    
    // Recommendations
    output += `### Recommendations\n\n`;
    
    if (historyResponse.analyses.length === 1) {
      output += `📊 **Single Analysis**: This project has only one analysis. Consider:\n`;
      output += `1. Setting up regular automated analysis in your CI/CD pipeline\n`;
      output += `2. Running analysis on feature branches\n`;
      output += `3. Establishing quality gates for continuous monitoring\n\n`;
    } else {
      const analysisFreqDays = calculateAnalysisFrequencyDays(historyResponse.analyses);
      
      if (analysisFreqDays > 7) {
        output += `⚠️ **Infrequent Analysis**: Analysis happens every ${Math.round(analysisFreqDays)} days on average.\n`;
        output += `1. Consider more frequent analysis for faster feedback\n`;
        output += `2. Integrate analysis into daily development workflow\n\n`;
      } else {
        output += `✅ **Good Analysis Frequency**: Regular analysis helps maintain code quality.\n`;
        output += `1. Continue current analysis schedule\n`;
        output += `2. Monitor trends for early issue detection\n\n`;
      }
    }
    
    // Next steps
    output += `### Next Steps\n\n`;
    output += `- Use \`get_project_metrics\` tool for current project status\n`;
    output += `- Use \`list_issues\` tool to see current code quality issues\n`;
    output += `- Use \`get_quality_gate\` tool to check quality gate status\n`;
    output += `- Set up automated analysis in CI/CD for continuous monitoring\n`;
    
    return output;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Error getting analysis history: ${errorMessage}`;
  }
}

function formatMetricName(metricKey: string): string {
  const metricNames: Record<string, string> = {
    'bugs': 'Bugs',
    'vulnerabilities': 'Vulnerabilities',
    'code_smells': 'Code Smells',
    'coverage': 'Coverage',
    'duplicated_lines_density': 'Duplication',
    'sqale_rating': 'Maintainability',
    'reliability_rating': 'Reliability',
    'security_rating': 'Security',
    'ncloc': 'Lines of Code',
    'complexity': 'Complexity',
    'cognitive_complexity': 'Cognitive Complexity',
  };
  
  return metricNames[metricKey] || metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getTrendDirection(firstValue: any, lastValue: any, metricKey: string): string {
  if (!firstValue || !lastValue) return '📊 No trend data available';
  
  const first = parseFloat(firstValue.toString());
  const last = parseFloat(lastValue.toString());
  
  if (isNaN(first) || isNaN(last)) return '📊 No trend data available';
  
  // For some metrics, lower is better (bugs, vulnerabilities, code_smells, duplicated_lines_density)
  const lowerIsBetter = ['bugs', 'vulnerabilities', 'code_smells', 'duplicated_lines_density', 'sqale_rating', 'reliability_rating', 'security_rating'].includes(metricKey);
  
  if (first === last) {
    return '➡️ Stable';
  } else if (first < last) {
    return lowerIsBetter ? '📈 Increasing (worse)' : '📈 Increasing (better)';
  } else {
    return lowerIsBetter ? '📉 Decreasing (better)' : '📉 Decreasing (worse)';
  }
}

function calculateAnalysisFrequency(analyses: any[]): string {
  if (analyses.length < 2) return 'N/A';
  
  const sortedAnalyses = analyses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalTimeSpan = new Date(sortedAnalyses[0].date).getTime() - new Date(sortedAnalyses[sortedAnalyses.length - 1].date).getTime();
  const averageInterval = totalTimeSpan / (analyses.length - 1);
  
  const days = Math.floor(averageInterval / (1000 * 60 * 60 * 24));
  const hours = Math.floor((averageInterval % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hour${hours > 1 ? 's' : ''}` : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const minutes = Math.floor(averageInterval / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

function calculateAnalysisFrequencyDays(analyses: any[]): number {
  if (analyses.length < 2) return 0;
  
  const sortedAnalyses = analyses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalTimeSpan = new Date(sortedAnalyses[0].date).getTime() - new Date(sortedAnalyses[sortedAnalyses.length - 1].date).getTime();
  const averageInterval = totalTimeSpan / (analyses.length - 1);
  
  return averageInterval / (1000 * 60 * 60 * 24);
}
