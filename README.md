# SonarQube MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to SonarQube code quality, security, and project analytics data.

[![npm version](https://badge.fury.io/js/mcp-sonarqube.svg)](https://www.npmjs.com/package/mcp-sonarqube)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Project Listing**: Get comprehensive project information with quality metrics
- **Project Metrics**: Fetch detailed quality metrics including coverage, duplication, maintainability
- **Issue Management**: List and analyze code quality issues with filtering capabilities
- **Security Analysis**: Get detailed security vulnerability and hotspot information
- **Quality Gates**: Check quality gate status and conditions
- **Historical Analysis**: View project evolution and quality trends over time

## Installation

### npm (Recommended)

```bash
# Global installation
npm install -g mcp-sonarqube

# Local installation in your project
npm install mcp-sonarqube
```

### From Source

1. Clone the repository:
```bash
git clone https://github.com/akhilthomas236/sonarqube-mcp-npm.git
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

## Quick Start

### 1. Install the package
```bash
npm install -g mcp-sonarqube
```

### 2. Set up environment variables
```bash
export SONARQUBE_URL="http://your-sonarqube-instance:9000"
export SONARQUBE_TOKEN="your-sonarqube-token"
```

### 3. Run as MCP Server
```bash
mcp-sonarqube
```

### 4. VS Code Integration

Create `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "sonarqube": {
      "command": "npx",
      "args": ["mcp-sonarqube"],
      "env": {
        "SONARQUBE_URL": "http://localhost:9000",
        "SONARQUBE_TOKEN": "your-sonarqube-token-here"
      }
    }
  }
}
```

Then use with GitHub Copilot:
```
@copilot List all projects in our SonarQube instance
@copilot Show me quality metrics for project "my-app"
@copilot What are the critical security vulnerabilities in project "api-service"?
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

### Method 1: Using npx (Recommended)
1. Create `.vscode/mcp.json` in your workspace:
```json
{
  "servers": {
    "sonarqube": {
      "command": "npx",
      "args": ["mcp-sonarqube"],
      "env": {
        "SONARQUBE_URL": "http://localhost:9000",
        "SONARQUBE_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Method 2: Using local installation
If you have the package installed locally:
```json
{
  "servers": {
    "sonarqube": {
      "command": "node",
      "args": ["./node_modules/mcp-sonarqube/dist/index.js"],
      "env": {
        "SONARQUBE_URL": "http://localhost:9000",
        "SONARQUBE_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Method 3: Global installation
If you have the package installed globally:
```json
{
  "servers": {
    "sonarqube": {
      "command": "mcp-sonarqube",
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

## Troubleshooting

### "Server exited before responding to initialize request"

If you encounter this error in VS Code or when using the MCP server, try these solutions:

1. **Test the server directly first:**
   ```bash
   # Test if the server starts correctly
   node dist/index.js
   # Should output: "SonarQube MCP Server started successfully"
   
   # Test with an MCP initialize request
   echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | node dist/index.js
   ```

2. **For VS Code integration issues:**
   - Make sure the package is installed globally: `npm install -g mcp-sonarqube`
   - Try using the full path instead of `npx`:
     ```json
     {
       "servers": {
         "sonarqube": {
           "command": "node",
           "args": ["/path/to/global/node_modules/mcp-sonarqube/dist/index.js"],
           "env": {
             "SONARQUBE_URL": "http://localhost:9000",
             "SONARQUBE_TOKEN": "your-token"
           }
         }
       }
     }
     ```
   - Restart VS Code after changing the MCP configuration

3. **For npx issues:**
   - Clear npm cache: `npm cache clean --force`
   - Reinstall the package: `npm uninstall -g mcp-sonarqube && npm install -g mcp-sonarqube`
   - Check Node.js version (requires Node.js 18+)

4. **Environment variable issues:**
   - Ensure `SONARQUBE_URL` and `SONARQUBE_TOKEN` are properly set
   - Test connection: `curl -u your-token: $SONARQUBE_URL/api/projects/search`

### SonarQube API Parameter Errors

If you encounter API errors related to invalid parameters:

1. **"additionalFields components must be one of..."**
   - This error has been fixed in version 1.0.2+
   - Update to the latest version: `npm update -g mcp-sonarqube`
   - The server now uses valid `additionalFields` values: `rules,users,comments`

2. **Invalid parameter values:**
   - Check that your SonarQube version supports the API endpoints being used
   - Some parameters may have different valid values in different SonarQube versions
   - Refer to your SonarQube instance's API documentation at: `{SONARQUBE_URL}/web_api`

### Network and Authentication Issues

1. **Connection errors:**
   - Verify SonarQube URL is accessible
   - Check firewall settings
   - Ensure SonarQube server is running

2. **Authentication errors:**
   - Verify token is valid and has appropriate permissions
   - Check token expiration
   - Ensure token has at least "Browse" permission on projects

3. **SSL/TLS issues:**
   - For self-signed certificates, you may need to set `NODE_TLS_REJECT_UNAUTHORIZED=0` (not recommended for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Links

- **npm Package**: https://www.npmjs.com/package/mcp-sonarqube
- **GitHub Repository**: https://github.com/akhilthomas236/sonarqube-mcp-npm
- **SonarQube Documentation**: https://docs.sonarqube.org/
- **Model Context Protocol**: https://modelcontextprotocol.io/

## Support

For issues and questions:
1. Check the SonarQube API documentation
2. Verify your token permissions
3. Ensure network connectivity to SonarQube
4. Check the server logs for detailed error messages
5. Create an issue on [GitHub](https://github.com/akhilthomas236/sonarqube-mcp-npm/issues)
