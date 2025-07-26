@echo off
echo 🚀 Clinix AI Hospital Management - Deployment Setup
echo.

echo 📋 Step 1: Initializing Git repository...
git init

echo 📝 Step 2: Adding all files...
git add .

echo 💾 Step 3: Creating initial commit...
git commit -m "Initial Clinix AI Hospital Management System - Mobile Responsive"

echo 🌿 Step 4: Setting main branch...
git branch -M main

echo.
echo ✅ Git setup complete!
echo.
echo 🌐 Next steps for Vercel deployment:
echo 1. Create a new repository on GitHub
echo 2. Run: git remote add origin https://github.com/yourusername/clinix-hospital.git
echo 3. Run: git push -u origin main
echo 4. Go to vercel.com and import your GitHub repository
echo 5. Add environment variables from .env.local
echo.
echo 📱 Your app is now mobile-responsive and ready for deployment!
echo.
pause
