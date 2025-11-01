#!/bin/bash
# Deploy to Render in 3 minutes!

set -e

echo "🚀 GitHub Webhook Automation - Render Deployment Script"
echo "========================================================"
echo ""

# Step 1: Generate webhook secret
echo "📋 Step 1: Generating webhook secret..."
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "   Generated secret: $WEBHOOK_SECRET"
echo "   ✓ Save this value in Render environment variables"
echo ""

# Step 2: Instructions for GitHub PAT
echo "📋 Step 2: Create GitHub Personal Access Token"
echo "   1. Go to: https://github.com/settings/personal-access-tokens/new"
echo "   2. Token name: 'webhook-automation'"
echo "   3. Scopes:"
echo "      • repo (read/write)"
echo "      • workflow (read/write)"
echo "   4. Click 'Generate token'"
echo "   5. Copy and save the token (only visible once!)"
echo ""

# Step 3: Deploy to Render
echo "📋 Step 3: Deploy to Render"
echo "   1. Go to: https://render.com"
echo "   2. Click 'New Web Service'"
echo "   3. Connect GitHub → select sgbilod/github-webhook-automation"
echo "   4. Configuration:"
echo "      Name: github-webhook-automation"
echo "      Build Command: npm install"
echo "      Start Command: npm start"
echo "      Instance Type: Free"
echo ""
echo "   5. Add Environment Variables:"
echo "      GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo "      GITHUB_TOKEN=<paste your PAT from step 2>"
echo "      PORT=3001"
echo ""
echo "   6. Click 'Create Web Service'"
echo ""

# Step 4: Wait for deployment
echo "⏳ Step 4: Wait for deployment..."
echo "   Render will build and deploy your service (2-3 minutes)"
echo "   Once done, you'll see a URL like: https://github-webhook-automation-xxxx.onrender.com"
echo ""

# Step 5: Configure webhook
echo "📋 Step 5: Configure GitHub Webhook"
echo "   1. Go to: https://github.com/settings/hooks"
echo "   2. Click 'Add webhook'"
echo "   3. Fill in:"
echo "      Payload URL: https://github-webhook-automation-xxxx.onrender.com/webhook"
echo "      Content type: application/json"
echo "      Secret: $WEBHOOK_SECRET"
echo "      Events: Let me select individual events → Repositories (A repository is created)"
echo "   4. Click 'Add webhook'"
echo ""

# Step 6: Test
echo "✅ Step 6: Test the automation"
echo "   1. Verify health check:"
echo "      curl https://github-webhook-automation-xxxx.onrender.com/healthz"
echo "      (should respond: ok)"
echo ""
echo "   2. Create a test repository in your GitHub account"
echo "   3. Wait 10-30 seconds"
echo "   4. Verify files were auto-created:"
echo "      • .vscode/settings.json"
echo "      • .vscode/extensions.json"
echo "      • .vscode/cagent.yaml"
echo "      • .vscode/mcp.json"
echo "      • .github/workflows/dev-setup.yml"
echo ""

echo "🎉 DONE! Your webhook automation is now live!"
echo ""
echo "📊 Next steps:"
echo "   • Every new repo you create will auto-configure itself"
echo "   • Check webhook deliveries at: https://github.com/settings/hooks"
echo "   • View server logs in Render dashboard"
echo ""
