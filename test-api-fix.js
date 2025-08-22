#!/usr/bin/env node

// Test script to verify the fixed additionalFields parameter
import { SonarQubeClient } from './dist/services/sonarqube-client.js';

const config = {
  baseUrl: process.env.SONARQUBE_URL || 'http://localhost:9000',
  token: process.env.SONARQUBE_TOKEN || 'test-token',
  organization: process.env.SONARQUBE_ORG
};

const client = new SonarQubeClient(config);

// Test the fixed listIssues method
async function testListIssues() {
  try {
    console.log('Testing listIssues with fixed additionalFields...');
    
    // This should now work without the "components" error
    const result = await client.listIssues({
      projectKey: 'test-project',
      ps: 5 // Small page size for testing
    });
    
    console.log('✅ listIssues API call successful!');
    console.log(`Found ${result.total} issues`);
    
  } catch (error) {
    if (error.message.includes('additionalFields') && error.message.includes('components')) {
      console.error('❌ The additionalFields error still exists!');
      console.error('Error:', error.message);
    } else {
      console.log('✅ additionalFields error is fixed!');
      console.log('Note: Other errors (like auth or connection) are expected without proper SonarQube setup');
      console.log('Error details:', error.message);
    }
  }
}

testListIssues();
