# AcademiaSentinel — Deployment Guide

## Step 1: Supabase Setup (5 min)
1. Go to https://supabase.com → New project → name it `academiasentinel`
2. Go to SQL Editor → paste contents of `supabase_schema.sql` → Run
3. Note your **Project URL** and **anon key** (Settings → API)
4. Note your **service_role key** (Settings → API → service_role — keep secret!)

## Step 2: Groq API Key (2 min)
1. Go to https://console.groq.com → API Keys → Create
2. Free tier: 14,400 req/day — plenty for demo

## Step 3: Deploy to Netlify (5 min)
1. Push this folder to GitHub (or zip it)
2. Go to https://netlify.com → Add new site → Import from GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables (Site Settings → Environment Variables):

   ```
   VITE_SUPABASE_URL = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJ...
   SUPABASE_URL = https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY = eyJ...
   GROQ_API_KEY = gsk_...
   ```

6. Deploy! Your site will be live at `https://academiasentinel.netlify.app`

## Step 4: Set up OSINT Scan Cron (optional)
In Netlify → Functions → Scheduled Functions, or use a free cron service:
- URL: `https://your-site.netlify.app/api/scan`
- Schedule: Every 30 minutes

## Live Features After Deploy:
- ✅ Dashboard with real threat data from Supabase
- ✅ Realtime WebSocket alerts (new threats appear instantly)
- ✅ AI Threat Classifier (Groq LLaMA)
- ✅ CERT-In Report Generator (Groq LLaMA)
- ✅ Predictive Risk Calendar (pre-computed, no API needed)
- ✅ Institution Risk Scores (16 real Indian institutions seeded)
- ✅ OSINT Scanner (HIBP + paste sites — trigger manually or via cron)
