# SonarQube MCP Server - Copilot Instructions

This file provides guidance for using the SonarQube MCP server tools effectively with GitHub Copilot.

## Available Tools Overview

The SonarQube MCP server provides 6 powerful tools for code quality analysis:

1. **list_projects** - Get an overview of all projects
2. **get_project_metrics** - Detailed quality metrics for a specific project
3. **list_issues** - Browse and filter code quality issues
4. **get_security_vulnerabilities** - Security-focused analysis
5. **get_quality_gate** - Quality gate status and conditions
6. **get_analysis_history** - Historical trends and evolution

## Common Usage Patterns

### 1. Project Discovery and Overview

Start with listing projects to understand what's available:

```
@copilot Use the list_projects tool to show me all projects in our SonarQube instance
```

For a specific project overview:

```
@copilot Give me a comprehensive quality overview of project "my-web-app" including metrics, quality gate status, and recent issues
```

### 2. Quality Assessment Workflow

**Step 1**: Check overall project health
```
@copilot Check the quality gate status for project "my-web-app"
```

**Step 2**: Get detailed metrics
```
@copilot Show me detailed metrics for project "my-web-app" including coverage, duplication, and maintainability
```

**Step 3**: Identify critical issues
```
@copilot List all BLOCKER and CRITICAL issues in project "my-web-app"
```

### 3. Security Analysis

Focus on security vulnerabilities:

```
@copilot Analyze security vulnerabilities in project "my-web-app" and prioritize them by severity
```

Get security hotspots that need review:

```
@copilot Show me security hotspots in project "my-web-app" that require manual review
```

### 4. Issue Management

Find specific types of issues:

```
@copilot Show me all unassigned BUGS in project "my-web-app"
```

Filter by assignee:

```
@copilot List issues assigned to "john.doe" in project "my-web-app"
```

### 5. Trend Analysis

Understand project evolution:

```
@copilot Show me the quality trends for project "my-web-app" over the last 3 months
```

Compare recent changes:

```
@copilot How has the code quality changed in project "my-web-app" since last month?
```

### 6. Branch-Specific Analysis

Analyze specific branches:

```
@copilot Check the quality gate status for the "develop" branch of project "my-web-app"
```

Compare branch quality:

```
@copilot Compare the code quality metrics between main and develop branches for project "my-web-app"
```

## Best Practices

### 1. Progressive Analysis

Start broad, then narrow down:
1. Use `list_projects` to see all available projects
2. Use `get_project_metrics` for overall health
3. Use `get_quality_gate` to check gate status
4. Use `list_issues` to dive into specific problems
5. Use `get_security_vulnerabilities` for security focus
6. Use `get_analysis_history` for trends

### 2. Effective Filtering

Use filters to focus on what matters:

- **By Severity**: Focus on BLOCKER and CRITICAL issues first
- **By Type**: Separate BUGs, VULNERABILITies, and CODE_SMELLs
- **By Status**: Look at OPEN and CONFIRMED issues
- **By Assignment**: Find unassigned issues that need owners

### 3. Security-First Approach

For security reviews:
1. Start with `get_security_vulnerabilities`
2. Filter by BLOCKER/CRITICAL severity
3. Review security hotspots
4. Check for unassigned security issues

### 4. Quality Gate Focus

For release readiness:
1. Check `get_quality_gate` status
2. If failed, use `list_issues` to see blockers
3. Focus on new code issues first
4. Verify coverage and duplication metrics

## Example Conversations

### Comprehensive Project Review

```
User: I need a complete quality assessment of our "e-commerce-api" project

Copilot: I'll provide a comprehensive quality assessment of your e-commerce-api project. Let me gather information from multiple angles:

[Uses get_project_metrics, get_quality_gate, list_issues, get_security_vulnerabilities]

Based on the analysis:

**Quality Gate**: ❌ FAILED
- 3 critical conditions not met
- New code coverage below 80% threshold
- 15 new bugs detected

**Key Metrics**:
- Overall Coverage: 67.3%
- New Code Coverage: 72.1% (below 80% threshold)
- Duplicated Lines: 8.2%
- Technical Debt: 2d 4h

**Critical Issues** (18 total):
- 3 BLOCKER bugs in authentication module
- 5 CRITICAL security vulnerabilities
- 2 CRITICAL code smells in payment processing

**Security Concerns**:
- SQL injection vulnerability in user search
- Hardcoded credentials in configuration
- Missing input validation in API endpoints

**Recommendations**:
1. Address BLOCKER bugs immediately before release
2. Fix security vulnerabilities (especially SQL injection)
3. Add unit tests to improve coverage
4. Review and refactor duplicated code
```

### Security-Focused Analysis

```
User: Check the security status of our "payment-service" project

Copilot: I'll perform a comprehensive security analysis of your payment-service project:

[Uses get_security_vulnerabilities, get_project_metrics for security rating]

**Security Assessment for payment-service**:

🚨 **HIGH RISK** - Immediate attention required

**Security Rating**: E (Worst)

**Critical Vulnerabilities** (7):
- SQL Injection in payment processing (BLOCKER)
- Hardcoded API keys (CRITICAL)
- Missing encryption for PII data (CRITICAL)
- Weak password validation (MAJOR)

**Security Hotspots** (12):
- Require manual review for actual risk assessment
- Focus on authentication and data handling modules

**Immediate Actions**:
1. **Stop deployment** until BLOCKER issues are resolved
2. **Audit all database queries** for injection vulnerabilities
3. **Remove hardcoded secrets** and use secure configuration
4. **Implement proper encryption** for sensitive data
5. **Review authentication mechanisms**

This payment service should not be deployed to production until security issues are resolved.
```

## Error Handling

Common error scenarios and how to handle them:

### Missing Project Key
```
Error: Project "wrong-key" not found
Solution: Use list_projects to find the correct project key
```

### Authentication Issues
```
Error: SONARQUBE_TOKEN environment variable is required
Solution: Set up proper authentication credentials
```

### Branch Not Found
```
Error: Branch "feature-x" not found for project "my-app"
Solution: Check available branches or use main branch
```

## Integration Tips

### With Development Workflow

- **Before commits**: Check quality gate status
- **During code review**: List issues for specific files
- **Before releases**: Comprehensive security scan
- **Sprint planning**: Review technical debt trends

### With CI/CD

- Use analysis history to track quality improvements
- Set up quality gate enforcement
- Monitor security vulnerability trends
- Track coverage and duplication metrics

### Team Collaboration

- Assign issues to team members
- Track progress on technical debt
- Share security vulnerability reports
- Monitor team-wide quality metrics

## Advanced Usage

### Custom Metrics Analysis

```
@copilot Compare code complexity metrics between "main" and "develop" branches for project "my-app"
```

### Time-based Trend Analysis

```
@copilot Show me how technical debt has evolved in project "my-app" over the last quarter
```

### Multi-project Comparison

```
@copilot Compare quality metrics between projects "frontend-app" and "backend-api"
```

### Issue Lifecycle Tracking

```
@copilot Show me the history of resolved issues in project "my-app" from last month
```

This comprehensive guide should help you make the most of the SonarQube MCP server tools with GitHub Copilot!
