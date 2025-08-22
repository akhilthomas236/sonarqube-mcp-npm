#!/usr/bin/env node

// Simple test script to verify MCP server functionality
import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

// Initialize request
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

// List tools request
const listToolsRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {}
};

let responses = [];

server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  if (response) {
    console.log('Server response:', response);
    responses.push(response);
  }
});

server.stderr.on('data', (data) => {
  console.error('Server stderr:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Send initialize request
console.log('Sending initialize request...');
server.stdin.write(JSON.stringify(initRequest) + '\n');

// Wait a bit then send list tools request
setTimeout(() => {
  console.log('Sending list tools request...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Close after another second
  setTimeout(() => {
    server.kill();
  }, 1000);
}, 1000);
