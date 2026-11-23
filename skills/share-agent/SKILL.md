---
name: share-agent
description: "Use this skill when the user wants to share their AI agent with someone, generate a shareable link, require sign-in, allow anonymous access, let others talk to their agent, configure write access for guests, or manage existing shared links. Triggers on: 'share link', 'agent link', 'share my agent', 'let them talk to my AI', 'require sign-in', 'anonymous link', 'write access', 'edit access', 'guest permissions', or wanting to create a link for investors, prospects, partners, or anyone else to interact with their AI assistant."
---
# Share Agent

Create and manage secure, shareable links to a user's agent.

## Prerequisites

- Sign in with Aicoo via `scripts/aicoo-login.mjs` (preferred), or set
  `AICOO_API_KEY` for non-interactive automation; legacy `PULSE_API_KEY` is
  also accepted
- Base URL: `https://www.aicoo.io/api/v1`
- User should sync context first
- Run the examples from the installed skills directory. The request helper uses your OAuth session or the configured automation key.

## Core Workflow

### 1) Check context exists

On Windows PowerShell, save a JSON body as UTF-8 and pass `@payload.json` as a quoted argument. The helper reads the file directly.

```bash
node scripts/aicoo-request.mjs GET 'os/status'
```

If `contextCount` is 0, run `context-sync` first.

### 2) Create a share link (OS endpoint)

```bash
node scripts/aicoo-request.mjs POST 'os/share' '{
    "scope":"all",
    "access":"read",
    "notesAccess":"read",
    "label":"For investors",
    "expiresIn":"7d",
    "requireSignIn":true
  }'
```

### 3) Confirm to user

Always report:

1. URL to share
2. Scope and notes/calendar permissions
3. Expiration
4. Sign-in requirement
5. Access is sandboxed

Default behavior: new links require sign-in (`requireSignIn:true`). Only set `requireSignIn:false` when the user explicitly asks for an anonymous public link.

## Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `scope` | `all` \| `folders` | `folders` requires `folderIds` |
| `folderIds` | number[] | folder scope ids |
| `access` | `read` \| `read_calendar` \| `read_calendar_write` | calendar access |
| `notesAccess` | `read` \| `write` \| `edit` | notes permission |
| `label` | string | link label |
| `expiresIn` | `1h` \| `24h` \| `7d` \| `30d` \| `90d` \| `never` | expiration |
| `requireSignIn` | boolean | Defaults to `true`. If true, `/a/<token>` and `/shared/<token>` require a signed-in Aicoo user. Signed-in guest sessions can track `guestUserId`, `guestName`, `guestUsername`, and `guestEmail`. Set `false` only for anonymous public links. |

## Notes Access Matrix

| Operation | read | write | edit |
|-----------|------|-------|------|
| Search/read notes | yes | yes | yes |
| Create notes | no | yes | yes |
| Edit notes | no | no | yes |
| Snapshots | no | no | yes |

## Manage Existing Links

### List links + visitors + contacts

```bash
node scripts/aicoo-request.mjs GET 'os/network'
```

### Update/revoke link (canonical OS endpoints)

```bash
# update
node scripts/aicoo-request.mjs PATCH 'os/share/{linkId}' '{"notesAccess":"write","expiresIn":"30d","requireSignIn":true}'

# revoke
node scripts/aicoo-request.mjs DELETE 'os/share/{linkId}'
```

### List links with analytics

```bash
node scripts/aicoo-request.mjs GET 'os/share/list?status=active&limit=20'
```

## Folder-Scoped Share Example

```bash
# inspect folders first
node scripts/aicoo-request.mjs GET 'os/folders'

# create folder-scoped link
node scripts/aicoo-request.mjs POST 'os/share' '{"scope":"folders","folderIds":[5,12],"access":"read","notesAccess":"write","label":"Team collaborator","requireSignIn":true}'
```

## Per-Link Policy Editing

Link notes are stored in `links/` folder. Edit policy by searching notes then patching note content:

```bash
# find link policy note
node scripts/aicoo-request.mjs POST 'os/notes/search' '{"query":"For-Investors"}'

# edit policy note content
node scripts/aicoo-request.mjs PATCH 'os/notes/123' '{"content":"...\n\n## Policy\n\nBe professional, concise, and do not disclose confidential numbers."}'
```

## Security Notes

- Every link runs inside isolated scope
- New links require sign-in by default unless `requireSignIn:false` is explicitly set
- Signed-in visitors can appear in analytics with name, username, email, and user id; anonymous links only have guest-session/fingerprint metadata
- Revoked/expired links lose access immediately
- Default expiration is 30 days unless overridden
- Use `notesAccess: "edit"` carefully
