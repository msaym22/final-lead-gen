# 🤖 AI Lead Generator - Complete Setup Guide

**Automated Lead Generation & Outreach System with YouTube Research**

This system automatically finds leads, analyzes their businesses, creates personalized outreach messages, and continuously learns from YouTube research - all 100% automated.

## 🎯 What This System Does

- **AI Research Engine**: Automatically researches YouTube for industry insights and strategies
- **Smart Lead Discovery**: Finds decision-makers at companies that need marketing help
- **Website Analysis**: Identifies specific marketing issues and opportunities
- **Personalized Messaging**: Generates custom outreach messages using AI and psychology
- **Continuous Learning**: Improves performance by analyzing successful patterns
- **100% Automation**: Runs daily via GitHub Actions with minimal manual input

## 📋 Prerequisites

Before starting, you'll need accounts for these **FREE** services:

1. **GitHub Account** (for hosting and automation)
2. **Vercel Account** (for website hosting)
3. **MongoDB Atlas Account** (for database)
4. **OpenAI Account** (for AI capabilities)
5. **Google Cloud Account** (for YouTube API)

## 🚀 Complete Setup Instructions

### Step 1: Clone and Setup Repository

1. **Fork this repository** to your GitHub account
2. **Clone to your computer**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-lead-generator.git
   cd ai-lead-generator
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

### Step 2: Get API Keys

#### OpenAI API Key
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create account and add $5-10 credit
3. Create new API key
4. Save it as: `sk-...`

#### YouTube Data API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Save the API key

#### MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free account
3. Create new cluster (free tier)
4. Create database user with password
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/ai-lead-generator`

### Step 3: Configure Environment Variables

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values**:
   ```bash
   # MongoDB Connection
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-lead-generator
   
   # OpenAI API
   OPENAI_API_KEY=sk-your-openai-api-key-here
   
   # YouTube Data API
   YOUTUBE_API_KEY=your-youtube-api-key-here
   
   # Personal Information
   NEXT_PUBLIC_YOUR_NAME=Muhammad Saim
   NEXT_PUBLIC_YOUR_WEBSITE=https://msaym22.github.io/Portfolio-Website/
   NEXT_PUBLIC_YOUR_CALENDLY=https://calendly.com/saimim057/conversation
   
   # Application Settings
   NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app
   NODE_ENV=production
   ```

### Step 4: Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login and deploy**:
   ```bash
   vercel login
   vercel --prod
   ```

3. **Set environment variables in Vercel**:
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all the variables from your `.env.local` file

### Step 5: Setup GitHub Secrets

1. **Go to your GitHub repository**
2. **Settings → Secrets and Variables → Actions**
3. **Add these Repository Secrets**:
   ```
   MONGODB_URI=your-mongodb-connection-string
   OPENAI_API_KEY=your-openai-api-key
   YOUTUBE_API_KEY=your-youtube-api-key
   DISCORD_WEBHOOK_URL=optional-for-notifications
   ```

4. **Add these Repository Variables**:
   ```
   NEXT_PUBLIC_YOUR_NAME=Muhammad Saim
   NEXT_PUBLIC_YOUR_WEBSITE=https://msaym22.github.io/Portfolio-Website/
   NEXT_PUBLIC_YOUR_CALENDLY=https://calendly.com/saimim057/conversation
   ```

### Step 6: Test the System

1. **Run locally first**:
   ```bash
   npm run dev
   ```

2. **Open http://localhost:3000**
3. **Test features**:
   - Create a campaign
   - Run YouTube research
   - Generate test leads
   - Create messages

### Step 7: Enable Automation

1. **GitHub Actions will automatically run daily at 9 AM UTC**
2. **To run manually**: Go to Actions tab → "Daily AI Lead Generation Automation" → "Run workflow"
3. **Check logs** to ensure everything works

## 🎛️ How to Use the System

### Creating Your First Campaign

1. **Go to Dashboard → Campaigns**
2. **Click "Create New Campaign"**
3. **Fill in details**:
   - Campaign Name: "SaaS Lead Generation"
   - Target Industry: "SaaS"
   - Company Size: "1-500"
   - Target Roles: "CEO, CTO, Marketing Director"
   - Daily Lead Target: 20

4. **Click "Start Campaign"**

### Understanding the Dashboard

- **Overview**: Campaign performance and daily stats
- **Campaigns**: Manage AI campaigns
- **Leads**: View discovered leads with opportunity scores
- **Messages**: Review AI-generated messages before sending
- **Analytics**: Track response rates and performance
- **AI Research**: See YouTube research insights

### Reviewing Generated Messages

**IMPORTANT**: Messages are generated for manual review, not auto-sent.

1. **Go to Messages section**
2. **Review each generated message**
3. **Copy approved messages to your email/LinkedIn**
4. **Track responses in the system**

## 📊 Understanding Lead Scoring

Leads are scored 0-100 based on:

- **Website Issues** (30%): Missing analytics, poor SEO, no email capture
- **Marketing Gaps** (25%): No retargeting, weak social presence
- **Business Fit** (25%): Company size, industry match, role relevance
- **Opportunity Size** (20%): Estimated ad spend potential, growth stage

**Focus on leads with 70+ scores for best results.**

## 🔧 Customization Options

### Modify Message Approaches

Edit `/src/app/api/message-generation/route.js`:

```javascript
// Add new approach
const approaches = {
  'custom_approach': {
    guidelines: 'Your custom guidelines here',
    psychology: ['Specific triggers'],
    cta: 'Your call-to-action style'
  }
}
```

### Add New Industries

Edit research queries in `/src/lib/youtube.js`:

```javascript
generateSearchTerms(industry) {
  // Add industry-specific terms
  if (industry.toLowerCase().includes('healthcare')) {
    return [...baseTerms, 'HIPAA compliant marketing', 'medical practice marketing']
  }
}
```

### Customize Lead Sources

Edit `/src/app/api/lead-discovery/route.js` to add new lead sources:

```javascript
// Add new search queries
const customQueries = [
  `${industry} companies hiring marketing roles`,
  `${industry} businesses with poor website speed`,
  // Add your custom search patterns
]
```

## 🚨 Troubleshooting

### Common Issues

**1. API Rate Limits**
- YouTube API: 10,000 units/day (each search = 100 units)
- OpenAI: Depends on your plan
- **Solution**: Adjust automation frequency in GitHub Actions

**2. No Leads Found**
- Check if your industry terms are too specific
- Verify API keys are working
- Review lead discovery logs

**3. Poor Message Quality**
- Ensure industry research has run successfully
- Check if OpenAI API key has sufficient credits
- Review message generation prompts

**4. GitHub Actions Failing**
- Check repository secrets are set correctly
- Verify MongoDB connection string
- Review workflow logs

### Debug Commands

```bash
# Test API connections
npm run test-apis

# Run lead discovery manually
npm run discover-leads

# Test message generation
npm run generate-messages

# Check database connection
npm run test-db
```

## 📈 Optimization Tips

### Improving Response Rates

1. **Industry Research**: Let the system research industries for 1-2 weeks before heavy messaging
2. **Message Personalization**: Review and edit AI messages before sending
3. **Timing**: Send messages Tuesday-Thursday, 9-11 AM in recipient's timezone
4. **Follow-up**: Use the follow-up message generator after 5-7 days

### Scaling the System

1. **Multiple Industries**: Create separate campaigns for each industry
2. **A/B Testing**: Use different message approaches for the same industry
3. **Lead Quality**: Focus on 80+ scored leads for better conversion
4. **Feedback Loop**: Mark messages as successful/unsuccessful to improve AI

## 💰 Cost Breakdown

**Monthly costs (for 1000+ leads):**

- **MongoDB Atlas**: $0 (free tier)
- **Vercel Hosting**: $0 (free tier)
- **GitHub Actions**: $0 (free tier, 2000 minutes)
- **OpenAI API**: $10-30 (depends on usage)
- **YouTube API**: $0 (free tier)

**Total: $10-30/month** for unlimited lead generation

## 🔒 Legal & Compliance

- **GDPR Compliant**: Only uses publicly available information
- **No Auto-sending**: Messages require manual review
- **Respect Rate Limits**: Built-in API limiting
- **Privacy Focused**: No personal data storage beyond business contacts

## 🆘 Support

### If You Need Help

1. **Check GitHub Issues**: Common problems and solutions
2. **Review Logs**: GitHub Actions → Workflow runs → Logs
3. **Test Components**: Use the debug commands above
4. **Verify Setup**: Ensure all API keys are valid

### Getting Updates

```bash
# Pull latest updates (be careful not to overwrite your changes)
git remote add upstream https://github.com/original-repo/ai-lead-generator.git
git fetch upstream
git merge upstream/main
```

## 🚀 What's Next

Once setup is complete, the system will:

1. **Day 1-3**: Research your target industries
2. **Day 4+**: Start discovering leads automatically
3. **Daily**: Generate 20-50 new leads with personalized messages
4. **Weekly**: Update industry research with new YouTube insights
5. **Monthly**: Provide optimization recommendations