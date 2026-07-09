# Railway Deployment Guide

This guide explains how to deploy the Enterprise AI WhatsApp Business Assistant to Railway.

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with the project code
- Environment variables configured

## Step 1: Create a Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account and select this repository
5. Railway will automatically detect the Node.js project

## Step 2: Configure Environment Variables

In the Railway dashboard, go to **Variables** and add the following:

### Database
- `DATABASE_URL`: MySQL connection string (Railway provides a MySQL plugin)

### WhatsApp & AI
- `GROQ_API_KEY`: Your GROQ API key
- `GROQ_MODEL`: `mixtral-8x7b-32768` (or your preferred model)

### Server
- `NODE_ENV`: `production`
- `PORT`: `3000` (Railway will set this automatically)

### JWT & Security
- `JWT_SECRET`: Generate a secure random string

### S3/File Storage
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: `us-east-1` (or your preferred region)
- `AWS_S3_BUCKET`: Your S3 bucket name

### Redis (for job queue)
- `REDIS_URL`: Railway provides a Redis plugin

### Manus OAuth (if using)
- `VITE_APP_ID`: Your Manus app ID
- `OAUTH_SERVER_URL`: `https://api.manus.im`
- `VITE_OAUTH_PORTAL_URL`: `https://manus.im`
- `OWNER_OPEN_ID`: Your owner ID
- `OWNER_NAME`: Your name

### App Configuration
- `VITE_APP_TITLE`: `Enterprise AI WhatsApp Assistant`
- `VITE_APP_LOGO`: URL to your logo image
- `BUSINESS_TIMEZONE`: `UTC` (or your timezone)

## Step 3: Add Database Plugin

1. In Railway dashboard, click "Add Plugin"
2. Select "MySQL"
3. Railway will automatically create a MySQL database
4. The `DATABASE_URL` will be automatically set

## Step 4: Add Redis Plugin (Optional but Recommended)

1. Click "Add Plugin"
2. Select "Redis"
3. The `REDIS_URL` will be automatically set

## Step 5: Configure Build Settings

Railway should automatically detect the build command from `package.json`:

```json
{
  "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js"
}
```

If not, manually set:
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`

## Step 6: Deploy

1. Click "Deploy" in the Railway dashboard
2. Monitor the deployment logs
3. Once deployed, Railway will provide a public URL

## Step 7: Run Database Migrations

After the first deployment:

1. Go to the Railway dashboard
2. Click on your project
3. Open the Shell tab
4. Run the database migration:
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

## Step 8: Configure Custom Domain (Optional)

1. In Railway dashboard, go to **Domains**
2. Click "Add Domain"
3. Enter your custom domain
4. Update your DNS records as instructed

## Environment Variables Reference

### Required
- `DATABASE_URL`: MySQL connection string
- `GROQ_API_KEY`: GROQ API key for AI
- `JWT_SECRET`: Secret for JWT tokens
- `NODE_ENV`: Set to `production`

### Optional but Recommended
- `REDIS_URL`: Redis connection for job queue
- `AWS_ACCESS_KEY_ID`: AWS access key for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3
- `AWS_S3_BUCKET`: S3 bucket name
- `AWS_REGION`: AWS region

### Application Configuration
- `VITE_APP_TITLE`: Application title
- `VITE_APP_LOGO`: Logo URL
- `BUSINESS_TIMEZONE`: Timezone for business operations
- `GROQ_MODEL`: GROQ model to use (default: `mixtral-8x7b-32768`)

## Monitoring and Logs

1. Go to Railway dashboard
2. Click on your project
3. View **Logs** to monitor application activity
4. Check **Metrics** for performance data

## Troubleshooting

### Build Fails
- Check that all dependencies are installed: `pnpm install`
- Verify Node.js version compatibility (18+)
- Check build logs for specific errors

### Database Connection Issues
- Verify `DATABASE_URL` format
- Ensure MySQL plugin is added
- Check that database migrations have run

### Application Won't Start
- Check that all required environment variables are set
- Review application logs in Railway dashboard
- Verify that the start command is correct

## Scaling

Railway automatically scales based on traffic. To adjust:

1. Go to **Settings**
2. Configure **CPU** and **Memory** limits
3. Set **Min Instances** and **Max Instances** for auto-scaling

## Backup and Recovery

Railway automatically backs up your data. To restore:

1. Contact Railway support
2. Provide the backup date/time
3. They will restore your database

## Cost Optimization

- Use Railway's free tier for development
- Monitor usage in the **Billing** section
- Consider using spot instances for non-critical workloads
- Set resource limits to prevent unexpected charges

## Support

- Railway Documentation: https://docs.railway.app
- Railway Support: https://railway.app/support
- Project Issues: Check GitHub issues

## Next Steps

After deployment:

1. Configure WhatsApp Business Account
2. Set up GROQ API credentials
3. Upload business documents to Knowledge Base
4. Configure payment methods
5. Test the AI assistant with sample messages
6. Set up automated campaigns and workflows
