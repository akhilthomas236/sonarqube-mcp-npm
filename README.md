# SonarQube MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to SonarQube code quality, security, and project analytics data.

## Features

- **Project Listing**: Get comprehensive project information with quality metrics
- **Project Metrics**: Fetch detailed quality metrics including coverage, duplication, maintainability
- **Issue Management**: List and analyze code quality issues with filtering capabilities
- **Security Analysis**: Get detailed security vulnerability and hotspot information
- **Quality Gates**: Check quality gate status and conditions
- **Historical Analysis**: View project evolution and quality trends over time

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sonarqube-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

Set the following environment variables:

```bash
export SONARQUBE_URL="http://your-sonarqube-instance:9000"
export SONARQUBE_TOKEN="your-sonarqube-token"
```

### Getting a SonarQube Token

1. Log in to your SonarQube instance
2. Go to User > My Account > Security
3. Generate a new token with appropriate permissions
4. Use this token as your `SONARQUBE_TOKEN`

## Usage

### Running the Server

```bash
npm start
```

The server runs on stdio transport and communicates via the Model Context Protocol.

### Available Tools

#### 1. `list_projects`
Lists all projects in your SonarQube instance with key metrics.

**Parameters:**
- `search` (optional): Filter projects by name or key
- `qualityGate` (optional): Filter by quality gate status (OK, WARN, ERROR)
- `organization` (optional): Filter by organization (SonarCloud)

#### 2. `get_project_metrics`
Get comprehensive metrics for a specific project.

**Parameters:**
- `projectKey` (required): The SonarQube project key
- `branch` (optional): Branch name (defaults to main branch)
- `metrics` (optional): Comma-separated list of specific metrics

#### 3. `list_issues`
List code quality issues with filtering options.

**Parameters:**
- `projectKey` (required): The SonarQube project key
- `branch` (optional): Branch name
- `types` (optional): Issue types (BUG, VULNERABILITY, CODE_SMELL)
- `severities` (optional): Severities (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)
- `statuses` (optional): Statuses (OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED)
- `assignees` (optional): Assignee usernames
- `tags` (optional): Issue tags
- `limit` (optional): Maximum number of issues (default: 50)

#### 4. `get_security_vulnerabilities`
Get detailed security vulnerability analysis.

**Parameters:**
- `projectKey` (required): The SonarQube project key
- `branch` (optional): Branch name
- `severities` (optional): Filter by severities
- `statuses` (optional): Filter by statuses
- `assigned` (optional): Filter by assigned/unassigned
- `limit` (optional): Maximum number of vulnerabilities (default: 50)

#### 5. `get_quality_gate`
Check quality gate status and conditions.

**Parameters:**
- `projectKey` (required): The SonarQube project key
- `branch` (optional): Branch name

#### 6. `get_analysis_history`
View historical analysis data and trends.

**Parameters:**
- `projectKey` (required): The SonarQube project key
- `branch` (optional): Branch name
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)
- `limit` (optional): Maximum number of analyses (default: 10)

## Development

### Project Structure

```
src/
├── index.ts                    # MCP server entry point
├── services/
│   └── sonarqube-client.ts    # SonarQube API client
├── tools/                     # MCP tool implementations
│   ├── list-projects.ts
│   ├── get-project-metrics.ts
│   ├── list-issues.ts
│   ├── get-security-vulnerabilities.ts
│   ├── get-quality-gate.ts
│   └── get-analysis-history.ts
├── types/
│   └── sonarqube.ts          # TypeScript type definitions
└── utils/
    └── formatting.ts         # Utility functions
```

### Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Start the MCP server
- `npm test` - Run tests

### Adding New Tools

1. Create a new tool file in `src/tools/`
2. Implement the tool schema and handler function
3. Add the tool to the imports and tools array in `src/index.ts`
4. Add a case for the tool in the CallTool handler

## VS Code Integration

To use this MCP server with VS Code and Copilot:

1. Create `.vscode/mcp.json` in your workspace:
```json
{
  "servers": {
    "sonarqube": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "SONARQUBE_URL": "http://localhost:9000",
        "SONARQUBE_TOKEN": "your-token-here"
      }
    }
  }
}
```

2. Install the MCP extension for VS Code
3. The SonarQube tools will be available in Copilot Chat

## Examples

### Check Project Quality

```
@copilot Use the SonarQube tools to give me a quality overview of project "my-app"
```

### Security Analysis

```
@copilot Show me all security vulnerabilities in project "my-app" that are CRITICAL or BLOCKER
```

### Quality Gate Status

```
@copilot Check if project "my-app" passes its quality gate
```

### Historical Trends

```
@copilot Show me the quality trends for project "my-app" over the last month
```

## Error Handling

The server provides detailed error messages for common issues:

- Missing environment variables
- Invalid project keys
- SonarQube connection issues
- Authentication failures
- Invalid parameters

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the SonarQube API documentation
2. Verify your token permissions
3. Ensure network connectivity to SonarQube
4. Check the server logs for detailed error messages
