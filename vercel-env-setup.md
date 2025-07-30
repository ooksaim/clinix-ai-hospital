# 🚀 Vercel Environment Variables Setup Guide

## Problem
Your Clinix AI Hospital system works locally but returns fallback responses on Vercel because environment variables are missing.

## Solution Steps

### 1. Open Vercel Dashboard
- Go to: https://vercel.com/dashboard
- Find your `clinix-ai-hospital` project
- Click on the project name

### 2. Navigate to Environment Variables
- Click "Settings" tab
- Click "Environment Variables" in the sidebar

### 3. Add Required Variables

**CRITICAL - Add these environment variables:**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `OPENAI_API_KEY` | `[Copy from your .env.local file]` | Production, Preview, Development |
| `GOOGLE_AI_API_KEY` | `[Copy from your .env.local file]` | Production, Preview, Development |
| `AIRTABLE_API_KEY` | `[Copy from your .env.local file]` | Production, Preview, Development |
| `AIRTABLE_BASE_ID` | `[Copy from your .env.local file]` | Production, Preview, Development |

### 4. Set Environment Scope
For each variable:
- ✅ Check "Production"
- ✅ Check "Preview" 
- ✅ Check "Development"

### 5. Redeploy
- Go to "Deployments" tab
- Click "..." on the latest deployment
- Click "Redeploy"

## Verification

After redeployment, test these features on your live site:
- ✅ Patient diagnosis should return AI-powered results
- ✅ Triage system should show proper AI recommendations
- ✅ Chat interface should work with AI responses
- ✅ Quota monitor should show actual usage

## Common Issues

### If still getting fallback responses:
1. Check environment variable names match exactly (case-sensitive)
2. Ensure values don't have extra spaces
3. Verify all environments are selected (Production/Preview/Development)
4. Try redeploying again

### If API errors occur:
1. Verify OpenAI API key is valid and has credits
2. Check Airtable credentials are correct
3. Monitor Vercel function logs for detailed errors

## Security Note
- Never commit API keys to your repository
- Use Vercel environment variables for production
- Regenerate keys if they were accidentally exposed
