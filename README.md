# GitHub Webhook Automation Server

Automatically configures new GitHub repositories with development environment settings, cagent configuration, MCP server setup, and GitHub Actions workflows.

**Status:** Production-ready | **Scope:** User (`sgbilod`) | **Events:** Repository creation

---

## 🎯 What This Does

When you create a new repository in your GitHub account, this webhook server automatically adds:

- ✅ `.vscode/settings.json` - VS Code configuration
- ✅ `.vscode/extensions.json` - Recommended extensions (Copilot, etc.)
- ✅ `.vscode/cagent.yaml` - Development agent configuration
- ✅ `.vscode/mcp.json` - MCP server configuration
- ✅ `.github/workflows/dev-setup.yml` - GitHub Actions validation workflow
- ✅ `README.md` - Initial project documentation (if repo is empty)

**Result:** Zero setup time. Create a repo and start developing immediately.

---

## 📋 Prerequisites

Before deploying, you need:

1. **GitHub Personal Access Token (PAT)**
   - Scopes required: `repo`, `workflow`
   - Generate at: https://github.com/settings/personal-access-tokens/new
   - Store it securely (only visible once!)

2. **Webhook Secret**
   - Generate a strong random string using: `openssl rand -hex 32`
   - Use this in both `.env` and GitHub webhook settings

3. **Deployment Target**
   - Cloud platform: Render (free tier), Railway, or similar
   - OR local: Docker and ngrok for testing

---

## 🚀 Quick Deploy to Render (Recommended - Free)

### Step 1: Create New PAT & Secret

```bash
# Generate webhook secret
openssl rand -hex 32
# Save this value!

# Create GitHub PAT at: https://github.com/settings/personal-access-tokens/new
# Scopes: repo, workflow
# Save the token!
```

### Step 2: Deploy Server

1. Go to https://render.com (create account if needed)
2. Click "New Web Service"
3. Connect to GitHub:
   - Select `sgbilod/github-webhook-automation`
   - Authorize Render to access your repositories
4. Configure:
   - **Name:** `github-webhook-automation`
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free tier (sufficient for webhooks)
5. Add Environment Variables (click "Add Secret File" or "Advanced"):
   ```
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxx  (your PAT from step 1)
   GITHUB_WEBHOOK_SECRET=xxxxx     (your secret from step 1)
   PORT=3001
   ```
6. Click "Deploy"

### Step 3: Get Your Deployment URL

After deployment completes:
1. Render shows your service URL (e.g., `https://github-webhook-automation.onrender.com`)
2. Verify it's working: `curl https://github-webhook-automation.onrender.com/healthz`
3. Expected response: `ok`
4. Copy this URL for Step 4

### Step 4: Configure GitHub Webhook

1. Go to https://github.com/settings/hooks
2. Click "Add webhook"
3. Fill in:
   - **Payload URL:** `https://github-webhook-automation.onrender.com/webhook` (use your Render URL)
   - **Content type:** `application/json`
   - **Secret:** Paste your webhook secret from Step 1
   - **Events:** Click "Let me select individual events"
     - ✓ Check "Repositories"
     - ✓ Check "A repository is created"
   - **Active:** ✓ Enabled
4. Click "Add webhook"

### Step 5: Test It

1. Create a new repository in your GitHub account
2. Wait 10-30 seconds
3. Refresh the repository page
4. Verify these files were auto-created:
   - `.vscode/settings.json` ✓
   - `.vscode/extensions.json` ✓
   - `.vscode/cagent.yaml` ✓
   - `.vscode/mcp.json` ✓
   - `.github/workflows/dev-setup.yml` ✓

**Success!** Every new repo you create now auto-configures itself. 🎉

---

## 🐳 Deploy with Docker (Local/Self-Hosted)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/sgbilod/github-webhook-automation.git
   cd github-webhook-automation
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your values:
   ```
   GITHUB_WEBHOOK_SECRET=your-webhook-secret
   GITHUB_TOKEN=ghp_your_token_here
   PORT=3001
   ```

4. Start with Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. Verify it's running:
   ```bash
   curl http://localhost:3001/healthz
   # Response: ok
   ```

### For Public Access (Testing with ngrok)

1. Install ngrok: https://ngrok.com/download
2. Start ngrok tunnel:
   ```bash
   ngrok http 3001
   ```
3. Copy the HTTPS forwarding URL (e.g., `https://random-subdomain.ngrok.app`)
4. Use this URL in GitHub webhook settings

---

## 🔒 Security Best Practices

- **Never commit `.env`** - Already in `.gitignore` ✓
- **Rotate tokens regularly** - Delete old PATs and create new ones
- **Use strong webhook secrets** - Generate with `openssl rand -hex 32`
- **Monitor webhook deliveries** - Check GitHub webhook logs for failures
- **Use environment variables** - Never hardcode secrets
- **Restrict PAT scopes** - Use minimal required scopes (`repo`, `workflow`)

---

## 📊 Troubleshooting

### Health Check Fails
```bash
curl https://your-url/healthz
```
- **Response:** Should be `ok`
- **Not responding?** Server may not be running or URL is incorrect

### Webhook Not Triggering
1. Verify webhook is installed: https://github.com/settings/hooks
2. Check "Recent Deliveries" tab for errors
3. Verify secret matches exactly (case-sensitive!)
4. Ensure "Repositories" event is checked

### Files Not Created
1. Check server logs in Render/Railway dashboard
2. Verify `GITHUB_TOKEN` is valid
3. Verify PAT has `repo` and `workflow` scopes
4. Manually test: Create test repo and check Recent Deliveries

### Server Crashes on Startup
1. Check environment variables are set
2. Ensure `PORT` is not already in use
3. Review logs for error messages

---

## 📁 File Structure

```
github-webhook-automation/
├── webhook-server.js      # Main Express server
├── package.json           # Node.js dependencies
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Docker orchestration
├── .env.example           # Environment template
├── .gitignore            # Git exclusions
└── README.md             # This file
```

---

## 🔧 API Reference

### Endpoints

**GET `/healthz`**
- Health check
- Response: `ok`
- Status: 200

**POST `/webhook`**
- GitHub webhook receiver
- Events: Repository creation
- Requires: Valid `x-hub-signature-256` header
- Response: `OK`
- Status: 200 (success), 401 (invalid signature)

---

## 📦 Dependencies

- `express` - HTTP server framework
- `@octokit/rest` - GitHub API client
- `dotenv` - Environment variable management
- `node:crypto` - HMAC signature verification

---

## 🚦 Next Steps

- ✅ Deploy server (Render, Railway, or Docker)
- ✅ Configure GitHub webhook
- ✅ Test with new repository
- ✅ Monitor webhook deliveries
- 🔮 Future: Add support for repository transfers
- 🔮 Future: Add backfill endpoint for existing repos

---

## 📞 Support

For issues:
1. Check recent webhook deliveries: https://github.com/settings/hooks
2. Review server logs in your deployment platform
3. Verify environment variables are correct
4. Test health endpoint: `curl https://your-url/healthz`

---

**Last Updated:** November 1, 2025  
**Maintained by:** sgbilod  
**License:** MIT
