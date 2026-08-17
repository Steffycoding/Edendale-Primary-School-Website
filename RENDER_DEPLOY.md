# Render Deployment Instructions

This project is ready to deploy to Render with zero code changes. Your Express server, file-based database, and authentication will work exactly as they do locally.

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up or log in
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Configure the service:

**Build & Deploy Settings:**
- **Name**: edendale-primary-school (or your preferred name)
- **Region**: Choose the closest region to you
- **Branch**: main
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Advanced Settings:**
- **Instance Type**: Free (or Standard for better performance)
- **Environment Variables**: (None required - uses default settings)

6. Click **Create Web Service**

### 3. Access Your Site

After deployment (usually takes 2-3 minutes):
- Your site will be available at: `https://your-service-name.onrender.com`
- Admin login will work with your existing credentials
- All features (content editing, events, cards) will function normally

## What Works on Render

✅ **Express Server** - Full Node.js/Express support
✅ **File-based Database** - `edendale.json` persists across deployments
✅ **Authentication** - Session-based auth works perfectly
✅ **File Uploads** - Multer image uploads work as expected
✅ **All Admin Features** - Content editing, events management, cards management

## Important Notes

- **Free Tier**: Render's free tier spins down after 15 minutes of inactivity and takes ~30 seconds to wake up
- **Persistence**: Your `edendale.json` file and uploaded images persist across deployments
- **HTTPS**: Automatic SSL certificate provided
- **Custom Domain**: You can add a custom domain in Render settings

## Troubleshooting

If you encounter issues:
1. Check the Render logs in your dashboard
2. Ensure all dependencies are in `package.json`
3. Verify the start command is `node server.js`
4. Make sure your repository is public or Render has access

## Local Development

To run locally:
```bash
npm install
node server.js
```

Your site will be available at `http://localhost:3000`
