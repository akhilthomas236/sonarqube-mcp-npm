import { TrendAnalysis, MetricTrend } from '../types/sonarqube.js';

/**
 * Format duration from minutes to human readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  }
  return `${days}d`;
}

/**
 * Parse technical debt string to minutes
 */
export function parseTechnicalDebt(debt: string): number {
  const regex = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)min)?/;
  const match = debt.match(regex);
  
  if (!match) return 0;
  
  const days = parseInt(match[1] || '0');
  const hours = parseInt(match[2] || '0');
  const minutes = parseInt(match[3] || '0');
  
  return (days * 24 * 60) + (hours * 60) + minutes;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Determine trend direction from percentage change
 */
export function getTrendDirection(change: number): 'UP' | 'DOWN' | 'STABLE' {
  if (Math.abs(change) < 1) return 'STABLE';
  return change > 0 ? 'UP' : 'DOWN';
}

/**
 * Format percentage with proper sign and precision
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Calculate trend analysis from metric history
 */
export function calculateTrends(metricTrends: MetricTrend[]): TrendAnalysis {
  const trends: TrendAnalysis = {};

  metricTrends.forEach(trend => {
    const history = trend.history.filter(h => h.value !== undefined);
    
    if (history.length < 2) {
      trends[trend.metric] = {
        direction: 'STABLE',
        change: '0%',
        changePercent: 0
      };
      return;
    }

    const latest = parseFloat(history[history.length - 1]!.value!);
    const previous = parseFloat(history[history.length - 2]!.value!);
    
    const changePercent = calculatePercentageChange(previous, latest);
    const direction = getTrendDirection(changePercent);
    
    trends[trend.metric] = {
      direction,
      change: formatPercentage(changePercent),
      changePercent
    };
  });

  return trends;
}

/**
 * Get severity level as number for sorting
 */
export function getSeverityLevel(severity: string): number {
  switch (severity.toUpperCase()) {
    case 'BLOCKER': return 5;
    case 'CRITICAL': return 4;
    case 'MAJOR': return 3;
    case 'MINOR': return 2;
    case 'INFO': return 1;
    default: return 0;
  }
}

/**
 * Get rating color for quality gates and ratings
 */
export function getRatingColor(rating: string): string {
  switch (rating) {
    case 'A': return '🟢';
    case 'B': return '🟡';
    case 'C': return '🟠';
    case 'D': return '🔴';
    case 'E': return '⚫';
    default: return '⚪';
  }
}

/**
 * Get status emoji for various statuses
 */
export function getStatusEmoji(status: string): string {
  switch (status.toUpperCase()) {
    case 'OK': return '✅';
    case 'ERROR': return '❌';
    case 'WARN': return '⚠️';
    case 'OPEN': return '🔓';
    case 'RESOLVED': return '✅';
    case 'CLOSED': return '🔒';
    case 'CONFIRMED': return '⚠️';
    case 'REOPENED': return '🔄';
    case 'TO_REVIEW': return '👀';
    case 'REVIEWED': return '✅';
    default: return '⚪';
  }
}

/**
 * Format large numbers with appropriate units
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Get priority level for issues based on type and severity
 */
export function getIssuePriority(type: string, severity: string): number {
  const typeWeight = type === 'BUG' ? 3 : type === 'VULNERABILITY' ? 4 : 1;
  const severityWeight = getSeverityLevel(severity);
  return typeWeight * severityWeight;
}

/**
 * Sort issues by priority (highest first)
 */
export function sortIssuesByPriority<T extends { type: string; severity: string }>(issues: T[]): T[] {
  return [...issues].sort((a, b) => {
    const priorityA = getIssuePriority(a.type, a.severity);
    const priorityB = getIssuePriority(b.type, b.severity);
    return priorityB - priorityA;
  });
}

/**
 * Validate SonarQube project key format
 */
export function isValidProjectKey(key: string): boolean {
  // SonarQube project keys can contain letters, digits, hyphens, underscores, periods, and colons
  const regex = /^[a-zA-Z0-9_:.-]+$/;
  return regex.test(key) && key.length > 0 && key.length <= 400;
}

/**
 * Parse quality gate operator to human readable text
 */
export function formatQualityGateOperator(operator: string): string {
  switch (operator) {
    case 'GT': return 'greater than';
    case 'LT': return 'less than';
    case 'EQ': return 'equals';
    case 'NE': return 'not equals';
    default: return operator;
  }
}

/**
 * Format metric name to human readable text
 */
export function formatMetricName(metric: string): string {
  const metricNames: { [key: string]: string } = {
    'ncloc': 'Lines of Code',
    'complexity': 'Cyclomatic Complexity',
    'coverage': 'Code Coverage',
    'duplicated_lines_density': 'Duplicated Lines',
    'bugs': 'Bugs',
    'vulnerabilities': 'Vulnerabilities',
    'code_smells': 'Code Smells',
    'technical_debt': 'Technical Debt',
    'sqale_rating': 'Maintainability Rating',
    'reliability_rating': 'Reliability Rating',
    'security_rating': 'Security Rating',
    'sqale_index': 'Technical Debt Ratio',
    'sqale_debt_ratio': 'Debt Ratio',
  };

  return metricNames[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Create a summary text for analysis results
 */
export function createAnalysisSummary(data: {
  projectName: string;
  totalIssues?: number;
  criticalIssues?: number;
  coverage?: number;
  duplications?: number;
  technicalDebt?: string;
  qualityGate?: string;
}): string {
  const parts = [`Analysis summary for ${data.projectName}:`];
  
  if (data.qualityGate) {
    parts.push(`${getStatusEmoji(data.qualityGate)} Quality Gate: ${data.qualityGate}`);
  }
  
  if (data.totalIssues !== undefined) {
    parts.push(`📊 Total Issues: ${data.totalIssues}`);
  }
  
  if (data.criticalIssues !== undefined) {
    parts.push(`🚨 Critical Issues: ${data.criticalIssues}`);
  }
  
  if (data.coverage !== undefined) {
    parts.push(`🧪 Coverage: ${data.coverage.toFixed(1)}%`);
  }
  
  if (data.duplications !== undefined) {
    parts.push(`📋 Duplications: ${data.duplications.toFixed(1)}%`);
  }
  
  if (data.technicalDebt) {
    parts.push(`⚠️ Technical Debt: ${data.technicalDebt}`);
  }
  
  return parts.join('\n');
}

/**
 * Generate recommendations based on analysis results
 */
export function generateRecommendations(data: {
  coverage?: number;
  duplications?: number;
  criticalIssues?: number;
  vulnerabilities?: number;
  technicalDebtMinutes?: number;
}): string[] {
  const recommendations: string[] = [];
  
  if (data.coverage !== undefined && data.coverage < 80) {
    recommendations.push(`📈 Improve test coverage (currently ${data.coverage.toFixed(1)}%, target: 80%+)`);
  }
  
  if (data.duplications !== undefined && data.duplications > 3) {
    recommendations.push(`🔄 Reduce code duplication (currently ${data.duplications.toFixed(1)}%, target: <3%)`);
  }
  
  if (data.criticalIssues !== undefined && data.criticalIssues > 0) {
    recommendations.push(`🚨 Address ${data.criticalIssues} critical issue(s) immediately`);
  }
  
  if (data.vulnerabilities !== undefined && data.vulnerabilities > 0) {
    recommendations.push(`🔒 Fix ${data.vulnerabilities} security vulnerability(ies)`);
  }
  
  if (data.technicalDebtMinutes !== undefined && data.technicalDebtMinutes > 480) { // More than 8 hours
    recommendations.push(`⚠️ Plan technical debt reduction (current: ${formatDuration(data.technicalDebtMinutes)})`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✨ Code quality looks good! Keep up the excellent work.');
  }
  
  return recommendations;
}

/**
 * Format issue type for display
 */
export function formatIssueType(type: string): string {
  switch (type.toLowerCase()) {
    case 'bug':
      return '🐛 Bug';
    case 'vulnerability':
      return '🔓 Vulnerability';
    case 'code_smell':
      return '🔍 Code Smell';
    case 'security_hotspot':
      return '🔥 Security Hotspot';
    default:
      return `❓ ${type}`;
  }
}

/**
 * Format severity for display
 */
export function formatSeverity(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'blocker':
      return '🚫 Blocker';
    case 'critical':
      return '🔴 Critical';
    case 'major':
      return '🟠 Major';
    case 'minor':
      return '🟡 Minor';
    case 'info':
      return 'ℹ️ Info';
    default:
      return `❓ ${severity}`;
  }
}
