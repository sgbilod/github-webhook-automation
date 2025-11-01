# ⚡ Quick Start - 15 Minutes to Live Automation

## What You'll Have After This

✅ Automatic repository configuration on creation  
✅ 24/7 deployment on Render's free tier  
✅ Zero manual setup for new repositories  
✅ Complete development environment auto-configured  

---

## 🎯 3-Step Quick Start

### Step 1: Generate Secrets (2 minutes)

**Generate webhook secret:**
```bash
openssl rand -hex 32
```
**Save this value** - you'll need it in 2 places.

**Create GitHub PAT:**
1. Go to: https://github.com/settings/personal-access-tokens/new
2. Token name: `webhook-automation`
3. Select scopes: `repo` + `workflow`
4. Click "Generate token"
5. **Copy and save** (you'll only see it once!)

### Step 2: Deploy to Render (5 minutes)

1. Go to https://render.com (create free account)
2. Click "New Web Service"
3. Connect to GitHub → select `sgbilod/github-webhook-automation`
4. Configure:
   - **Name:** `github-webhook-automation`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance:** Free tier
5. Add Environment Variables:
   ```
   GITHUB_WEBHOOK_SECRET=<your secret from Step 1>
   GITHUB_TOKEN=<your PAT from Step 1>
   PORT=3001
   ```
6. Click "Create Web Service"
7. **Wait 2-3 minutes** for deployment

### Step 3: Configure GitHub Webhook (3 minutes)

1. Go to https://github.com/settings/hooks
2. Click "Add webhook"
3. Fill in:
   - **Payload URL:** `https://github-webhook-automation-xxxx.onrender.com/webhook`
     (Use the URL from your Render dashboard)
   - **Content type:** `application/json`
   - **Secret:** Paste your webhook secret (same as Step 1)
   - **Events:** "Let me select individual events" → Check "Repositories" → "A repository is created"
   - **Active:** ✓ Enabled
4. Click "Add webhook"

---

## ✅ Verify It Works (2 minutes)

**Test 1: Health check**
```bash
curl https://github-webhook-automation-xxxx.onrender.com/healthz
```
Expected: `ok`

**Test 2: Create a test repo**
1. Create new repository in your GitHub account (any name)
2. Wait 10-30 seconds
3. Refresh the repo page
4. Verify these files exist:
   - ✓ `.vscode/settings.json`
   - ✓ `.vscode/extensions.json`
   - ✓ `.vscode/cagent.yaml`
   - ✓ `.vscode/mcp.json`
   - ✓ `.github/workflows/dev-setup.yml`

**Done!** 🎉

---

## 🐛 Troubleshooting

### Webhook not triggering?
- Check: https://github.com/settings/hooks → Recent Deliveries
- Verify secret matches exactly (case-sensitive)
- Verify "Repositories" event is checked

### Files not appearing?
- Check Render logs in dashboard
- Verify `GITHUB_TOKEN` is correct and has `repo` + `workflow` scopes
- Verify PAT hasn't expired

### Health check fails?
- Check Render dashboard for deployment errors
- Verify environment variables are set
- Check server logs

---

## 📚 Full Documentation

See [README.md](README.md) for:
- Complete feature details
- Alternative deployment options
- Security best practices
- API reference
- Advanced configuration

---

## 🚀 That's It!

From now on, every new repository you create will automatically configure itself.  
No manual steps. Ever.

**Next time you create a repo:** Watch the magic happen. ✨

