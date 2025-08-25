# Deployment Guide

This guide will help you deploy your Uniswap V3 - Camelot V3 Arbitrage Bot to Railway and other cloud platforms.

## 🚀 Deploy to Railway

Railway is a modern deployment platform that makes it easy to deploy and scale applications.

### Prerequisites

1. **GitHub Account**: You'll need a GitHub account to store your code
2. **Railway Account**: Sign up at [railway.app](https://railway.app)
3. **Environment Variables**: Have your Alchemy API key and wallet private key ready

### Step 1: Push to GitHub

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Uniswap-Camelot arbitrage bot"
   ```

2. **Create GitHub Repository**
   - Go to [github.com](https://github.com) and create a new repository
   - Name it something like `uniswap-camelot-arbitrage-bot`
   - Don't initialize with README (we already have one)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/uniswap-camelot-arbitrage-bot.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Railway

1. **Connect Railway to GitHub**
   - Go to [railway.app](https://railway.app) and sign in
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables**
   In Railway dashboard, go to Variables tab and add:
   ```
   ALCHEMY_API_KEY=your_actual_alchemy_api_key
   PRIVATE_KEY=your_actual_wallet_private_key
   WALLET_ADDRESS=your_actual_wallet_address
   ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your_api_key
   ARBITRUM_WS_URL=wss://arb-mainnet.g.alchemy.com/v2/your_api_key
   PORT=3000
   ```

3. **Deploy**
   - Railway will automatically detect it's a Node.js project
   - It will run `npm install` and then `npm start`
   - Your bot will be live in a few minutes!

### Step 3: Monitor Your Bot

1. **View Logs**
   - In Railway dashboard, go to "Deployments" tab
   - Click on your deployment to view real-time logs
   - You should see the bot starting up and monitoring pairs

2. **Access Web Interface**
   - Railway will provide a public URL for your app
   - Visit the URL to see the web monitoring interface

## 🔧 Alternative Deployment Options

### Heroku

1. **Install Heroku CLI**
2. **Create Heroku App**
   ```bash
   heroku create your-arbitrage-bot
   ```
3. **Set Environment Variables**
   ```bash
   heroku config:set ALCHEMY_API_KEY=your_key
   heroku config:set PRIVATE_KEY=your_private_key
   # ... add all other variables
   ```
4. **Deploy**
   ```bash
   git push heroku main
   ```

### DigitalOcean App Platform

1. **Connect GitHub Repository**
2. **Configure Build Settings**
   - Build Command: `npm install`
   - Run Command: `npm start`
3. **Set Environment Variables** in the dashboard
4. **Deploy**

### AWS/Google Cloud/Azure

For more advanced deployments, you can use:
- **AWS Elastic Beanstalk**
- **Google Cloud Run**
- **Azure Container Instances**

## ⚠️ Important Security Notes

1. **Never commit .env file** - It's already in .gitignore
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** for security
4. **Monitor your wallet** for unexpected transactions
5. **Set spending limits** on your wallet if possible

## 📊 Monitoring and Maintenance

### Health Checks

Your bot includes basic health monitoring. You can:
- Check logs for swap detections and price calculations
- Monitor the web interface for real-time status
- Set up alerts for when the bot stops responding

### Scaling

For high-frequency trading, consider:
- Using multiple instances across different regions
- Implementing load balancing
- Adding database logging for trade history
- Setting up monitoring and alerting systems

### Updates

To update your deployed bot:
1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Railway will automatically redeploy

## 🆘 Troubleshooting

### Common Issues

1. **Bot not starting**
   - Check environment variables are set correctly
   - Verify Alchemy API key is valid
   - Ensure wallet has some ETH for gas

2. **No swap detections**
   - Check WebSocket connection to Alchemy
   - Verify token pair addresses are correct
   - Ensure pools exist on both exchanges

3. **Deployment failures**
   - Check build logs in Railway dashboard
   - Verify package.json has all dependencies
   - Ensure Node.js version compatibility

### Getting Help

1. Check Railway documentation
2. Review bot logs for error messages
3. Test locally first before deploying
4. Join DeFi developer communities for support

## 💰 Cost Considerations

### Railway Pricing
- **Hobby Plan**: $5/month - Good for testing
- **Pro Plan**: $20/month - Better for production

### Gas Costs
- Each arbitrage transaction costs gas
- Failed transactions still consume gas
- Monitor your wallet balance regularly

### Alchemy Costs
- Free tier: 300M compute units/month
- Growth tier: $199/month for higher limits

---

**🎉 Congratulations!** Your arbitrage bot is now running 24/7 in the cloud, ready to capture profitable opportunities between Uniswap V3 and Camelot V3!
