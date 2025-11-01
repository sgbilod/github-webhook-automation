# GitHub Webhook Automation (User scope: sgbilod)

This server listens for GitHub repository creation events and automatically configures each new repo with:
- VS Code settings and extension recommendations
- cagent configuration
- MCP server configuration
- A validation GitHub Actions workflow

## Requirements

- GitHub Webhook (User settings) subscribed to the “Repositories” event
- GitHub Personal Access Token (PAT) with:
  - Classic: `repo`, `workflow` (recommended). You asked for `admin:repo_hook` scope; that’s fine if you intend to manage hooks via API later.
  - Fine-grained alternative: Repository contents read/write for all (or selected) repos.

## Setup

1) Create a `.env` file:
```
GITHUB_WEBHOOK_SECRET=REPLACE_WITH_SECRET
GITHUB_TOKEN=ghp_your_token_here
PORT=3001
```

2) Start with Docker:
```
docker-compose up -d
```

3) (Dev URL) Start an ngrok tunnel:
```
ngrok http 3001
```
Copy the HTTPS forwarding URL from ngrok, e.g. `https://random-subdomain.ngrok.app`.

4) Configure the GitHub User webhook:
- Go to https://github.com/settings/hooks → “Add webhook”
- Payload URL: `https://<your-ngrok-domain>/webhook`
- Content type: `application/json`
- Secret: the same `GITHUB_WEBHOOK_SECRET` you put in `.env`
- Events: “Let me select individual events” → “Repositories” → check “A repository is created”
- Active: ✓

5) Test
- Create a new repository under `sgbilod`
- The server will automatically add:
  - `.vscode/settings.json`
  - `.vscode/extensions.json`
  - `.vscode/cagent.yaml`
  - `.vscode/mcp.json`
  - `.github/workflows/dev-setup.yml`

## Notes

- Signature verification uses the raw request body and `x-hub-signature-256`.
- If a repo is empty, the server will create an initial `README.md` to ensure a default branch exists.
- Logs will print actions taken and any errors encountered.
