# Netlify Deployment Setup

This project has been configured to work with Netlify Functions using Netlify KV for persistent data storage.

## Prerequisites

1. Netlify account
2. Git repository with this project
3. Netlify CLI (optional, for local testing)

## Setup Steps

### 1. Enable Netlify KV

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings > Functions**
4. Enable **Netlify KV** (Key-Value store)
5. Note your KV namespace ID

### 2. Environment Variables

No additional environment variables are required. The functions will automatically use Netlify KV when available.

### 3. Deploy

**Option A: Via Git Integration (Recommended)**
1. Push your code to GitHub/GitLab/Bitbucket
2. In Netlify dashboard: **Add new site > Import from Git**
3. Connect your repository
4. Build settings:
   - Build command: `npm install`
   - Publish directory: `public`
5. Deploy

**Option B: Via Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## How It Works

- **API Endpoints**: Your Express API routes are now Netlify Functions
- **Data Storage**: Uses Netlify KV instead of `edendale.json` file
- **Authentication**: Same token-based auth system
- **Frontend**: No changes required - works exactly the same

## Important Notes

- Netlify KV provides persistent storage across function invocations
- Initial data (admin users, events, content) is seeded automatically on first load
- Your current passwords (`edendale2024`, `kennis2026`) will work
- File uploads are not supported in this Netlify setup (would require additional configuration)

## Testing Locally

To test functions locally:
```bash
npm install
netlify dev
```

This will simulate Netlify Functions locally (without KV persistence).
