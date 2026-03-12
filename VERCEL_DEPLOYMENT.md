# Vercel Deployment Guide for Catcher App

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your project should be connected to GitHub
3. **Neon PostgreSQL Database**: Set up production database
4. **Cloudinary Account**: For image uploads in production

## Environment Variables Setup

### Required Environment Variables

Add these environment variables to your Vercel project:

#### Application Configuration
```
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=generate-a-secure-secret-here
```

#### Database Configuration
```
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/catcher?sslmode=require"
```

#### NextAuth Credentials
```
NEXTAUTH_CREDENTIALS_USERNAME=your-admin-username
NEXTAUTH_CREDENTIALS_PASSWORD=your-admin-password
```

#### Cloudinary Configuration
```
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## Deployment Steps

### 1. Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `/` (root)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 2. Set Environment Variables
1. In your Vercel project settings
2. Go to "Environment Variables"
3. Add all required environment variables
4. Set Environment to "Production"

### 3. Configure Database
1. Set up Neon PostgreSQL production database
2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Push database schema:
   ```bash
   npx prisma db push
   ```

### 4. Deploy
1. Click "Deploy" in Vercel dashboard
2. Wait for deployment to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Post-Deployment Setup

### 1. Database Initialization
After first deployment, you may need to:
1. Run initial database setup
2. Create admin user if needed
3. Test database connections

### 2. SSL and Custom Domain
1. Add custom domain in Vercel settings
2. Configure SSL certificates (automatic with Vercel)
3. Set up domain redirects if needed

### 3. Monitoring
1. Enable Vercel Analytics
2. Set up error tracking
3. Monitor performance metrics

## Performance Optimization

### Image Optimization
- Vercel automatically optimizes images
- Cloudinary handles file uploads
- WebP and AVIF formats are supported

### Caching Strategy
- API routes are cached automatically
- Static assets are CDN-distributed
- Database queries should be optimized

### Security Features
- Automatic HTTPS
- Security headers configured
- Rate limiting available

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify database connection
   - Check package.json dependencies

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Neon PostgreSQL settings
   - Ensure SSL mode is enabled

3. **Authentication Issues**
   - Verify NEXTAUTH_SECRET
   - Check NEXTAUTH_URL format
   - Ensure credentials are correct

### Debugging
1. Check Vercel deployment logs
2. Use Vercel's built-in debugging tools
3. Monitor API endpoints
4. Check database connections

## Production Best Practices

### Security
- Use strong secrets and passwords
- Enable 2FA on all accounts
- Regularly update dependencies
- Monitor for security vulnerabilities

### Performance
- Optimize images before upload
- Use efficient database queries
- Implement proper caching
- Monitor resource usage

### Maintenance
- Regular database backups
- Monitor application performance
- Update dependencies regularly
- Review security settings

## Support

For additional help:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)