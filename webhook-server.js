/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { Octokit } = require('@octokit/rest');

const app = express();

// Capture RAW body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

const {
  GITHUB_WEBHOOK_SECRET,
  GITHUB_TOKEN,
  PORT = 3001
} = process.env;

if (!GITHUB_WEBHOOK_SECRET) console.warn('⚠️  GITHUB_WEBHOOK_SECRET is not set');
if (!GITHUB_TOKEN) console.warn('⚠️  GITHUB_TOKEN is not set');

const octokit = new Octokit({ auth: GITHUB_TOKEN });

function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(a || '', 'utf8');
  const bBuf = Buffer.from(b || '', 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !GITHUB_WEBHOOK_SECRET) return false;
  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
  return timingSafeEqual(signature, digest);
}

app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

app.post('/webhook', async (req, res) => {
  // GitHub ping support
  const ghEvent = req.headers['x-github-event'];
  if (ghEvent === 'ping') {
    return res.status(200).json({ msg: 'pong' });
  }

  if (!verifySignature(req)) {
    return res.status(401).send('Unauthorized');
  }

  const payload = req.body;
  // Only handle repository creation events
  if (ghEvent === 'repository' && payload.action === 'created' && payload.repository) {
    const repo = payload.repository;
    const owner = repo.owner.login;
    const name = repo.name;
    console.log(`📦 New repository created: ${owner}/${name}`);

    try {
      // Ensure initial commit exists (README) to create default branch on empty repos
      await ensureInitialCommit(owner, name);

      // 1) VS Code config
      await setupVSCodeConfig(owner, name);

      // 2) cagent config
      await setupCagentConfig(owner, name);

      // 3) MCP config
      await setupMCPConfig(owner, name);

      // 4) GitHub Actions workflow
      await setupGitHubActions(owner, name);

      console.log(`✅ Successfully configured ${owner}/${name}`);
    } catch (err) {
      console.error(`❌ Error setting up ${owner}/${name}:`, err?.message || err);
    }
  }

  res.status(200).send('OK');
});

async function ensureInitialCommit(owner, repo) {
  try {
    await octokit.repos.getContent({ owner, repo, path: 'README.md' });
    // Already exists
  } catch {
    const content = Buffer.from(`# ${repo}\n\nInitialized by webhook automation.\n`).toString('base64');
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: '🤖 chore: initial README for automation',
      content
    });
    console.log(' ✓ Initial README.md created');
  }
}

async function createOrUpdateFile(owner, repo, path, textContent, message) {
  const content = Buffer.from(textContent).toString('base64');
  try {
    const existing = await octokit.repos.getContent({ owner, repo, path });
    const sha = Array.isArray(existing.data) ? null : existing.data.sha;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content,
      sha: sha || undefined
    });
  } catch (err) {
    if (err.status === 404) {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content
      });
    } else {
      throw err;
    }
  }
}

async function setupVSCodeConfig(owner, repo) {
  const settings = {
    "github.copilot.chat.agent.enabled": true,
    "chat.mcp.access": "all",
    "chat.mcp.autoConnect": true,
    "mcp.gateway.url": "http://localhost:3000",
    "mcp.autoDiscover": true,
    "terminal.integrated.env.linux": {
      "CAGENT_CONFIG": "${workspaceFolder}/.vscode/cagent.yaml"
    }
  };

  const extensions = {
    "recommendations": [
      "github.copilot",
      "github.copilot-chat",
      "ms-vscode.vscode-typescript-next"
    ]
  };

  await createOrUpdateFile(
    owner, repo,
    '.vscode/settings.json',
    JSON.stringify(settings, null, 2),
    '🤖 Auto-setup: Add VS Code settings'
  );

  await createOrUpdateFile(
    owner, repo,
    '.vscode/extensions.json',
    JSON.stringify(extensions, null, 2),
    '🤖 Auto-setup: Add VS Code extensions'
  );

  console.log(' ✓ VS Code configuration added');
}

async function setupCagentConfig(owner, repo) {
  const cagentConfig = `version: "1.0"
name: ${repo}-dev-agent
description: Development agent for ${repo}

extends: "\${env:HOME}/.config/cagent/global-dev-agent.yaml"

agent:
  instructions: |
    \${parent.instructions}
    
    Project-specific context:
    - Repository: ${owner}/${repo}
    - Created: ${new Date().toISOString()}
    - Owner: ${owner}
    
  tools:
    - type: filesystem
      name: project_files
      permissions:
        read: ["."]
        write: ["."]
        exclude: ["node_modules", ".git", "*.env", ".vscode"]
    
    - type: mcp
      name: github_operations
      server: github-official
      config:
        repository: "${owner}/${repo}"
`;

  await createOrUpdateFile(
    owner, repo,
    '.vscode/cagent.yaml',
    cagentConfig,
    '🤖 Auto-setup: Add cagent configuration'
  );

  console.log(' ✓ cagent configuration added');
}

async function setupMCPConfig(owner, repo) {
  const mcpConfig = {
    "servers": {
      "github": {
        "type": "http",
        "url": "https://api.githubcopilot.com/mcp/",
        "headers": {
          "Authorization": "Bearer ${input:github_mcp_pat}"
        },
        "context": {
          "repository": `${owner}/${repo}`
        }
      }
    },
    "inputs": [
      {
        "type": "promptString",
        "id": "github_mcp_pat",
        "description": "GitHub Personal Access Token",
        "password": true
      }
    ]
  };

  await createOrUpdateFile(
    owner, repo,
    '.vscode/mcp.json',
    JSON.stringify(mcpConfig, null, 2),
    '🤖 Auto-setup: Add MCP server configuration'
  );

  console.log(' ✓ MCP configuration added');
}

async function setupGitHubActions(owner, repo) {
  const workflow = `name: Auto-setup Development Environment

on:
  push:
    branches: [main, master]

jobs:
  validate-setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate cagent config
        run: |
          if [ -f .vscode/cagent.yaml ]; then
            echo "✓ cagent configuration found"
          else
            echo "cagent configuration missing" && exit 1
          fi
          
      - name: Validate MCP config
        run: |
          if [ -f .vscode/mcp.json ]; then
            echo "✓ MCP configuration found"
          else
            echo "MCP configuration missing" && exit 1
          fi
`;

  await createOrUpdateFile(
    owner, repo,
    '.github/workflows/dev-setup.yml',
    workflow,
    '🤖 Auto-setup: Add GitHub Actions workflow'
  );

  console.log(' ✓ GitHub Actions workflow added');
}

app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on port ${PORT}`);
  console.log(`📍 POST ${process.env.PUBLIC_URL || 'http://localhost:' + PORT}/webhook`);
});
