#!/bin/bash

# Vercel Deployment Script for Catcher App

set -e

echo "🚀 Starting Vercel deployment for Catcher App..."

# Check if required tools are installed
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI is required but not installed. Install with: npm install -g vercel"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed."; exit 1; }

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please initialize git first."
    exit 1
fi

# Check for untracked files
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have untracked files. Consider committing them first."
    git status --porcelain
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Check environment variables
echo "🔍 Checking environment variables..."

required_vars=(
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
    "NEXTAUTH_CREDENTIALS_USERNAME"
    "NEXTAUTH_CREDENTIALS_PASSWORD"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please set these variables in your .env.local file or Vercel dashboard."
    exit 1
fi

echo "✅ All required environment variables are set."

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful."

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app is now live on Vercel!"
else
    echo "❌ Deployment failed. Please check the logs above."
    exit 1
fi

echo "🎉 Vercel deployment completed successfully!"