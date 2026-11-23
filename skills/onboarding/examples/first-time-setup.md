# Example: First-Time Onboarding for a Startup Founder

## Conversation Flow

**User**: "I want to set up Aicoo and share my agent with investors"

### Step 1: Sign in with Aicoo

```bash
node scripts/aicoo-login.mjs
```

Interactive users should use OAuth. Only CI/cron environments without a browser
should use an API key:

```bash
export AICOO_API_KEY=aicoo_sk_live_abc123...
# PowerShell: $env:AICOO_API_KEY="aicoo_sk_live_abc123..."
```

### Step 2: Initialize workspace and make the first API call

On Windows PowerShell, save a JSON body as UTF-8 and pass `@payload.json` as a quoted argument. The helper reads the file directly.

```bash
node scripts/aicoo-request.mjs POST init
node scripts/aicoo-request.mjs GET os/status
```

### Step 3: Explore and collect context

Ask startup basics (product, team, traction, boundaries), then scan local files.

### Step 4: Create first note (OS endpoint)

```bash
node scripts/aicoo-request.mjs POST 'os/notes' '{
    "title":"About Us - Acme Corp",
    "content":"# Acme Corp\n\nWe build AI-powered widgets...\n\n## Team\n- Jane (CEO)\n- Bob (CTO)\n\n## Traction\n- 10K users, $50K MRR"
  }'
```

### Step 5: Bulk sync project docs

```bash
node scripts/aicoo-request.mjs POST 'accumulate' '{
    "files": [
      {"path":"Public/pitch-deck.md","content":"# Pitch Deck\n\n..."},
      {"path":"Technical/architecture.md","content":"# Architecture\n\n..."}
    ]
  }'
```

### Step 6: Create investor share link

```bash
node scripts/aicoo-request.mjs POST 'os/share' '{
    "scope":"folders",
    "folderIds":[1,3],
    "access":"read",
    "notesAccess":"read",
    "label":"For investors",
    "expiresIn":"30d",
    "requireSignIn":true
  }'
```

Result: `https://www.aicoo.io/a/xK9mPq2RvT`

Share this URL with investors; sign-in is required by default. Use `requireSignIn:false` only for an explicitly anonymous public link.
