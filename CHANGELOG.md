# Changelog

All notable changes to the SonarQube MCP Server project will be documented in this file.

## [1.1.0] - 2025-08-22

### Added
- **New Tool: `get_project_repository`** - Get comprehensive git repository information for SonarQube projects
  - Retrieves SCM links, project links (homepage, CI, issues)
  - Extracts repository provider, organization, and name from URLs
  - Supports GitHub, GitLab, Bitbucket, and Azure DevOps repositories
  - Optional branch information retrieval
  - ALM integration details (Enterprise feature)

### Improved
- Enhanced URL parsing for repository providers
- Uses flexible matching ("github" vs "github.com") for better enterprise support
- More robust provider detection for various Git hosting services

## [1.0.3] - 2025-08-22

### Fixed
- Fixed tool name mapping in MCP server switch statement
- Corrected `sonarqube_list_projects` tool recognition (was incorrectly mapped as `list_projects`)
- Corrected `sonarqube_get_project_metrics` tool recognition (was incorrectly mapped as `get_project_metrics`)
- Resolves "unknown tool" errors when using the MCP server

## [1.0.2] - 2025-08-22

### Fixed
- Fixed SonarQube API error with `additionalFields` parameter in issues/search endpoint
- Changed invalid `components` field to `comments` in additionalFields parameter
- Server now properly handles issue listing without API parameter errors

## [1.0.1] - 2025-08-22

### Changed
- Version bump for release pipeline

## [1.0.0] - 2025-08-10

### Added
- Initial release of SonarQube MCP Server
- Complete TypeScript implementation with strict type checking
- Six comprehensive MCP tools for SonarQube integration:
  - `list_projects` - Browse and filter SonarQube projects
  - `get_project_metrics` - Detailed quality metrics analysis
  - `list_issues` - Code quality issue management with advanced filtering
  - `get_security_vulnerabilities` - Security-focused analysis and risk assessment
  - `get_quality_gate` - Quality gate status and condition checking
  - `get_analysis_history` - Historical trend analysis and project evolution
- Full SonarQube REST API client with comprehensive error handling
- Rich formatting utilities for metrics, trends, and recommendations
- VS Code integration with MCP configuration
- Comprehensive documentation including PRD, README, and Copilot instructions
- Environment-based configuration support
- Graceful error handling and detailed error messages

### Features
- **Project Discovery**: List and search projects with quality gate filtering
- **Quality Analysis**: Comprehensive metrics including coverage, duplication, maintainability
- **Issue Management**: Advanced filtering by type, severity, status, assignee, and tags
- **Security Focus**: Dedicated security vulnerability and hotspot analysis
- **Trend Analysis**: Historical data and quality evolution tracking
- **Quality Gates**: Real-time quality gate status and condition monitoring
- **AI Integration**: Optimized for use with GitHub Copilot and other AI assistants

### Technical Highlights
- Modern TypeScript with ES modules
- Model Context Protocol (MCP) server implementation
- Comprehensive type definitions for SonarQube API
- Robust error handling and validation
- Environment variable configuration
- VS Code workspace integration
- Cross-platform compatibility

### Documentation
- Complete Product Requirements Document (PRD)
- Comprehensive README with setup and usage instructions
- Detailed Copilot instructions for effective AI assistant usage
- Example configurations and use cases
- API documentation and best practices

### Files Added
```
src/
├── index.ts                           # MCP server entry point
├── services/sonarqube-client.ts       # SonarQube API client
├── tools/                             # MCP tool implementations
│   ├── list-projects.ts
│   ├── get-project-metrics.ts
│   ├── list-issues.ts
│   ├── get-security-vulnerabilities.ts
│   ├── get-quality-gate.ts
│   ├── get-analysis-history.ts
│   └── get-project-repository.ts      # New tool for repository information
├── types/sonarqube.ts                 # TypeScript type definitions
└── utils/formatting.ts               # Utility functions

Configuration:
├── package.json                       # Project configuration
├── tsconfig.json                      # TypeScript configuration
├── .env.example                       # Environment variables template
└── .vscode/mcp.json                   # VS Code MCP configuration

Documentation:
├── PRD.md                             # Product Requirements Document
├── README.md                          # Project documentation
├── copilot-instructions.md            # AI assistant usage guide
└── CHANGELOG.md                       # This file
```

### Dependencies
- `@modelcontextprotocol/sdk` - MCP server framework
- `axios` - HTTP client for SonarQube API
- `zod` - Runtime type validation
- `dotenv` - Environment variable management
- TypeScript and related development dependencies

### Requirements
- Node.js 18+ 
- TypeScript 5+
- Access to SonarQube instance (local or cloud)
- Valid SonarQube authentication token

### Usage Examples
- Comprehensive code quality assessment
- Security vulnerability analysis
- Quality gate monitoring
- Project trend analysis
- Issue management and tracking
- AI-powered code quality insights

This release provides a complete, production-ready MCP server for SonarQube integration with AI assistants, enabling powerful code quality analysis and insights through natural language interactions.
