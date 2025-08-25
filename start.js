console.log("🚀 Starting Arbitrage Bot...")
console.log("📅 Timestamp:", new Date().toISOString())
console.log("🌍 Node.js version:", process.version)
console.log("📂 Working directory:", process.cwd())

// Check environment variables
console.log("\n🔍 Checking environment variables...")

const requiredEnvVars = [
  'ALCHEMY_API_KEY',
  'PRIVATE_KEY', 
  'WALLET_ADDRESS',
  'ARBITRUM_RPC_URL',
  'ARBITRUM_WS_URL'
]

let missingVars = []
for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`)
  } else {
    console.log(`❌ ${envVar}: Missing`)
    missingVars.push(envVar)
  }
}

if (missingVars.length > 0) {
  console.error(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`)
  console.error("Please set these variables in your Railway environment settings.")
  process.exit(1)
}

console.log("\n🔄 Loading main bot application...")

// Start the main bot
try {
  require('./bot.js')
} catch (error) {
  console.error("\n❌ Failed to start bot:", error.message)
  console.error("Stack trace:", error.stack)
  process.exit(1)
}
