import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  SonarQubeConfig,
  SonarQubeProject,
  ProjectMetrics,
  SonarQubeIssue,
  SecurityVulnerability,
  SecurityHotspot,
  QualityGate,
  AnalysisHistory,
  ProjectAnalysis,
  MetricTrend,
  IssuesResponse,
  ListProjectsParams,
  GetProjectMetricsParams,
  ListIssuesParams,
  GetSecurityVulnerabilitiesParams,
  GetQualityGateParams,
  GetAnalysisHistoryParams,
  SonarQubeError,
  MCPError
} from '../types/sonarqube.js';

export class SonarQubeClient {
  private client: AxiosInstance;
  private config: SonarQubeConfig;

  constructor(config: SonarQubeConfig) {
    this.config = config;
    
    // Remove trailing slash from baseUrl
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    
    this.client = axios.create({
      baseURL: `${baseUrl}/api`,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      auth: {
        username: config.token,
        password: '', // SonarQube uses token as username with empty password
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`SonarQube API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('SonarQube API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        const mcpError = this.transformError(error);
        console.error('SonarQube API Error:', mcpError);
        return Promise.reject(mcpError);
      }
    );
  }

  private transformError(error: any): MCPError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as SonarQubeError;
      const message = data.errors?.[0]?.msg || error.response.statusText;
      const mcpError = new Error(`SonarQube API Error (${error.response.status}): ${message}`) as MCPError;
      mcpError.code = error.response.status.toString();
      mcpError.details = data;
      return mcpError;
    } else if (error.request) {
      // Request was made but no response received
      const mcpError = new Error('SonarQube API: No response received') as MCPError;
      mcpError.code = 'NO_RESPONSE';
      return mcpError;
    } else {
      // Error in request configuration
      const mcpError = new Error(`SonarQube API: ${error.message}`) as MCPError;
      mcpError.code = 'REQUEST_ERROR';
      return mcpError;
    }
  }

  /**
   * Test the connection to SonarQube
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/system/status');
      return true;
    } catch (error) {
      console.error('SonarQube connection test failed:', error);
      return false;
    }
  }

  /**
   * List all accessible SonarQube projects
   */
  async listProjects(params: ListProjectsParams = {}): Promise<SonarQubeProject[]> {
    try {
      const queryParams: any = {
        qualifiers: 'TRK', // Only include projects (not portfolios, applications, etc.)
        ...params,
      };

      if (this.config.organization) {
        queryParams.organization = this.config.organization;
      }

      const response = await this.client.get('/projects/search', {
        params: queryParams,
      });

      return response.data.components || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comprehensive project metrics
   */
  async getProjectMetrics(params: GetProjectMetricsParams): Promise<ProjectMetrics> {
    try {
      const defaultMetrics = [
        'ncloc', 'complexity', 'coverage', 'duplicated_lines_density',
        'bugs', 'vulnerabilities', 'code_smells', 'technical_debt',
        'sqale_rating', 'reliability_rating', 'security_rating',
        'maintainability_rating', 'sqale_index', 'sqale_debt_ratio'
      ];

      const queryParams: any = {
        component: params.projectKey,
        metricKeys: params.metrics || defaultMetrics.join(','),
      };

      if (params.branch) queryParams.branch = params.branch;
      if (params.pullRequest) queryParams.pullRequest = params.pullRequest;
      if (this.config.organization) queryParams.organization = this.config.organization;

      const response = await this.client.get('/measures/component', {
        params: queryParams,
      });

      const component = response.data.component;
      const measures = component.measures || [];

      // Transform measures to a more usable format
      const metrics: { [key: string]: string | number } = {};
      measures.forEach((measure: any) => {
        let value: string | number = measure.value;
        
        // Convert numeric metrics to numbers
        if (measure.metric.match(/^(ncloc|complexity|coverage|duplicated_lines_density|bugs|vulnerabilities|code_smells|sqale_index|sqale_debt_ratio)$/)) {
          const numValue = parseFloat(String(value));
          if (!isNaN(numValue)) {
            value = numValue;
          }
        }
        
        metrics[measure.metric] = value;
      });

      const result: ProjectMetrics = {
        projectKey: params.projectKey,
        metrics,
      };

      if (params.branch) {
        result.branch = params.branch;
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * List project issues with filtering options
   */
  async listIssues(params: ListIssuesParams): Promise<IssuesResponse> {
    try {
      const queryParams: any = {
        componentKeys: params.projectKey,
        ps: params.ps || 100, // Default page size
        p: params.p || 1,
        additionalFields: 'rules,users,components',
        facets: 'severities,types,rules,tags,assignees,languages',
        ...params,
      };

      if (params.branch) queryParams.branch = params.branch;
      if (params.pullRequest) queryParams.pullRequest = params.pullRequest;
      if (this.config.organization) queryParams.organization = this.config.organization;

      const response = await this.client.get('/issues/search', {
        params: queryParams,
      });

      return {
        issues: response.data.issues || [],
        paging: response.data.paging,
        data: response.data.issues || [],
        components: response.data.components,
        rules: response.data.rules,
        users: response.data.users,
        languages: response.data.languages,
        facets: response.data.facets,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get security vulnerabilities and hotspots
   */
  async getSecurityVulnerabilities(params: GetSecurityVulnerabilitiesParams): Promise<{
    vulnerabilities: SecurityVulnerability[];
    hotspots: SecurityHotspot[];
  }> {
    try {
      // Get vulnerabilities
      const vulnParams: any = {
        componentKeys: params.projectKey,
        types: 'VULNERABILITY',
        ps: params.ps || 100,
        p: params.p || 1,
      };

      if (params.branch) vulnParams.branch = params.branch;
      if (params.severity) vulnParams.severities = params.severity;
      if (params.status) vulnParams.statuses = params.status;
      if (this.config.organization) vulnParams.organization = this.config.organization;

      const vulnerabilitiesResponse = await this.client.get('/issues/search', {
        params: vulnParams,
      });

      // Get security hotspots
      const hotspotsParams: any = {
        projectKey: params.projectKey,
        ps: params.ps || 100,
        p: params.p || 1,
      };

      if (params.branch) hotspotsParams.branch = params.branch;
      if (params.status) hotspotsParams.status = params.status;
      if (this.config.organization) hotspotsParams.organization = this.config.organization;

      const hotspotsResponse = await this.client.get('/hotspots/search', {
        params: hotspotsParams,
      });

      return {
        vulnerabilities: vulnerabilitiesResponse.data.issues || [],
        hotspots: hotspotsResponse.data.hotspots || [],
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get quality gate status and conditions
   */
  async getQualityGate(params: GetQualityGateParams): Promise<QualityGate> {
    try {
      const queryParams: any = {
        projectKey: params.projectKey,
      };

      if (params.branch) queryParams.branch = params.branch;
      if (params.pullRequest) queryParams.pullRequest = params.pullRequest;
      if (this.config.organization) queryParams.organization = this.config.organization;

      const response = await this.client.get('/qualitygates/project_status', {
        params: queryParams,
      });

      const projectStatus = response.data.projectStatus;
      
      return {
        status: projectStatus.status,
        conditions: projectStatus.conditions || [],
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get project analysis history and trends
   */
  async getAnalysisHistory(params: GetAnalysisHistoryParams): Promise<AnalysisHistory> {
    try {
      const queryParams: any = {
        project: params.projectKey,
        ps: params.ps || 100,
        p: params.p || 1,
      };

      if (params.branch) queryParams.branch = params.branch;
      if (params.category) queryParams.category = params.category;
      if (params.from) queryParams.from = params.from;
      if (params.to) queryParams.to = params.to;
      if (this.config.organization) queryParams.organization = this.config.organization;

      const response = await this.client.get('/project_analyses/search', {
        params: queryParams,
      });

      return {
        analyses: response.data.analyses || [],
        paging: response.data.paging,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get metric trends over time
   */
  async getMetricTrends(
    projectKey: string,
    metrics: string[],
    from?: string,
    to?: string,
    branch?: string
  ): Promise<MetricTrend[]> {
    try {
      const queryParams: any = {
        component: projectKey,
        metrics: metrics.join(','),
      };

      if (branch) queryParams.branch = branch;
      if (from) queryParams.from = from;
      if (to) queryParams.to = to;
      if (this.config.organization) queryParams.organization = this.config.organization;

      const response = await this.client.get('/measures/search_history', {
        params: queryParams,
      });

      return response.data.measures || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get project languages
   */
  async getProjectLanguages(projectKey: string, branch?: string): Promise<string[]> {
    try {
      const queryParams: any = {
        component: projectKey,
        metricKeys: 'ncloc_language_distribution',
      };

      if (branch) queryParams.branch = branch;
      if (this.config.organization) queryParams.organization = this.config.organization;

      const response = await this.client.get('/measures/component', {
        params: queryParams,
      });

      const component = response.data.component;
      const measures = component.measures || [];
      
      const languageDistribution = measures.find((m: any) => m.metric === 'ncloc_language_distribution');
      if (languageDistribution && languageDistribution.value) {
        // Parse format like "java=1234;typescript=5678;css=90"
        return languageDistribution.value
          .split(';')
          .map((lang: string) => lang.split('=')[0])
          .filter((lang: string) => lang);
      }

      return [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<any> {
    try {
      const response = await this.client.get('/system/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
