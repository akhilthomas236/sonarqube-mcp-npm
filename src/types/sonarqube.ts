// SonarQube API Types and Interfaces

export interface SonarQubeConfig {
  baseUrl: string;
  token: string;
  organization?: string;
}

export interface SonarQubeProject {
  key: string;
  name: string;
  organization?: string;
  qualifier: string;
  visibility: 'public' | 'private';
  lastAnalysisDate?: string;
  qualityGate?: string;
  language?: string;
  description?: string;
  tags?: string[];
}

export interface ProjectMetrics {
  projectKey: string;
  branch?: string;
  metrics: {
    coverage?: number;
    duplicated_lines_density?: number;
    technical_debt?: string;
    complexity?: number;
    ncloc?: number;
    bugs?: number;
    vulnerabilities?: number;
    code_smells?: number;
    sqale_rating?: 'A' | 'B' | 'C' | 'D' | 'E';
    reliability_rating?: 'A' | 'B' | 'C' | 'D' | 'E';
    security_rating?: 'A' | 'B' | 'C' | 'D' | 'E';
    maintainability_rating?: 'A' | 'B' | 'C' | 'D' | 'E';
    sqale_index?: number;
    sqale_debt_ratio?: number;
    [key: string]: string | number | undefined;
  };
}

export interface SonarQubeIssue {
  key: string;
  rule: string;
  severity: 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
  type: 'BUG' | 'VULNERABILITY' | 'CODE_SMELL' | 'SECURITY_HOTSPOT';
  component: string;
  project: string;
  line?: number;
  hash?: string;
  textRange?: {
    startLine: number;
    endLine: number;
    startOffset: number;
    endOffset: number;
  };
  flows?: any[];
  message: string;
  effort?: string;
  debt?: string;
  author?: string;
  tags?: string[];
  status: 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';
  resolution?: 'FIXED' | 'WONTFIX' | 'FALSE-POSITIVE';
  assignee?: string;
  creationDate: string;
  updateDate: string;
  closeDate?: string;
}

export interface SecurityVulnerability extends SonarQubeIssue {
  type: 'VULNERABILITY';
  cvssScore?: number;
  cweId?: string;
  owaspTop10?: string[];
  sansTop25?: string[];
}

export interface SecurityHotspot {
  key: string;
  component: string;
  project: string;
  line?: number;
  message: string;
  author?: string;
  status: 'TO_REVIEW' | 'REVIEWED';
  resolution?: 'FIXED' | 'SAFE' | 'ACKNOWLEDGED';
  rule: string;
  securityCategory: string;
  vulnerabilityProbability: 'HIGH' | 'MEDIUM' | 'LOW';
  creationDate: string;
  updateDate: string;
}

export interface QualityGate {
  status: 'OK' | 'WARN' | 'ERROR';
  conditions: QualityGateCondition[];
}

export interface QualityGateCondition {
  metric: string;
  operator: 'GT' | 'LT' | 'EQ' | 'NE';
  threshold: string;
  actualValue?: string;
  status: 'OK' | 'WARN' | 'ERROR';
  errorThreshold?: string;
  warningThreshold?: string;
}

export interface ProjectAnalysis {
  key: string;
  date: string;
  projectVersion?: string;
  buildString?: string;
  revision?: string;
  manualNewCodePeriodBaseline?: boolean;
  detectedCI?: string;
}

export interface AnalysisHistory {
  analyses: ProjectAnalysis[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

export interface MetricTrend {
  metric: string;
  history: Array<{
    date: string;
    value?: string;
  }>;
}

export interface TrendAnalysis {
  [metric: string]: {
    direction: 'UP' | 'DOWN' | 'STABLE';
    change: string;
    changePercent?: number;
  };
}

export interface PaginatedResponse<T> {
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  data: T[];
}

export interface IssuesResponse extends PaginatedResponse<SonarQubeIssue> {
  issues: SonarQubeIssue[];
  components?: Component[];
  rules?: Rule[];
  users?: User[];
  languages?: Language[];
  facets?: Facet[];
}

export interface Component {
  key: string;
  name: string;
  qualifier: string;
  language?: string;
  path?: string;
  longName?: string;
}

export interface Rule {
  key: string;
  name: string;
  lang: string;
  langName: string;
  type: string;
  severity: string;
  status: string;
  tags?: string[];
  sysTags?: string[];
  htmlDesc?: string;
  mdDesc?: string;
  htmlNote?: string;
  mdNote?: string;
  debtRemFnType?: string;
  debtRemFnCoeff?: string;
  defaultDebtRemFnType?: string;
  defaultDebtRemFnCoeff?: string;
  isTemplate?: boolean;
  templateKey?: string;
}

export interface User {
  login: string;
  name: string;
  email?: string;
  active: boolean;
  avatar?: string;
}

export interface Language {
  key: string;
  name: string;
}

export interface Facet {
  property: string;
  values: Array<{
    val: string;
    count: number;
  }>;
}

// MCP Tool Parameter Types
export interface ListProjectsParams {
  organization?: string;
  search?: string;
  qualityGate?: string;
  analyzedBefore?: string;
  onProvisionedOnly?: boolean;
  projects?: string;
  q?: string;
  qualifiers?: string;
  visibility?: 'public' | 'private';
  p?: number;
  ps?: number;
}

export interface GetProjectMetricsParams {
  projectKey: string;
  branch?: string;
  pullRequest?: string;
  metrics?: string;
  additionalFields?: string;
}

export interface ListIssuesParams {
  projectKey: string;
  branch?: string;
  pullRequest?: string;
  componentKeys?: string;
  directories?: string;
  files?: string;
  issues?: string;
  severities?: string;
  impactSeverities?: string;
  types?: string;
  impactSoftwareQualities?: string;
  resolved?: boolean;
  statuses?: string;
  tags?: string;
  assignees?: string;
  assigned?: boolean;
  authors?: string;
  createdAfter?: string;
  createdBefore?: string;
  createdInLast?: string;
  languages?: string;
  rules?: string;
  cwe?: string;
  owaspTop10?: string;
  owaspTop10_2021?: string;
  sansTop25?: string;
  sonarsourceSecurity?: string;
  timeZone?: string;
  additionalFields?: string;
  asc?: boolean;
  s?: string;
  p?: number;
  ps?: number;
  facets?: string;
}

export interface GetSecurityVulnerabilitiesParams {
  projectKey: string;
  branch?: string;
  pullRequest?: string;
  severity?: string;
  status?: string;
  resolution?: string;
  p?: number;
  ps?: number;
}

export interface GetQualityGateParams {
  projectKey: string;
  branch?: string;
  pullRequest?: string;
}

export interface GetAnalysisHistoryParams {
  projectKey: string;
  branch?: string;
  category?: string;
  from?: string;
  to?: string;
  p?: number;
  ps?: number;
}

// Error Types
export interface SonarQubeError {
  errors: Array<{
    msg: string;
  }>;
}

export interface MCPError extends Error {
  code?: string;
  details?: any;
}

// Tool Response Types
export interface ToolResponse<T = any> {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface ProjectListResponse {
  projects: SonarQubeProject[];
  total: number;
  summary?: {
    totalProjects: number;
    publicProjects: number;
    privateProjects: number;
    lastAnalyzed: number;
    qualityGatesPassed: number;
    qualityGatesFailed: number;
  };
}

export interface SecurityAnalysisResponse {
  vulnerabilities: SecurityVulnerability[];
  hotspots: SecurityHotspot[];
  summary: {
    totalVulnerabilities: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
    hotspotsToReview: number;
    hotspotsReviewed: number;
    securityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  };
}

export interface HistoricalAnalysisResponse {
  analyses: ProjectAnalysis[];
  trends: TrendAnalysis;
  summary: {
    totalAnalyses: number;
    firstAnalysis: string;
    lastAnalysis: string;
    analysisFrequency: string;
    trendDirection: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  };
}
