require("dotenv").config()
const ethers = require('ethers')

/**
 * This file could be used for initializing some
 * of the main contracts such as the V3 router & 
 * factory. This is also where we initialize the
 * main Arbitrage contract.
 */

const config = require('../config.json')
const IUniswapV3Factory = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json')
const IQuoter = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoterV2.sol/IQuoterV2.json')
const ISwapRouter = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')

// Algebra Factory ABI for Camelot V3
const IAlgebraFactory = {
  abi: [
    "function poolByPair(address tokenA, address tokenB) external view returns (address pool)"
  ]
}

let provider

if (config.PROJECT_SETTINGS.isLocal) {
  provider = new ethers.WebSocketProvider(`ws://127.0.0.1:8545/`)
} else {
  provider = new ethers.WebSocketProvider(`wss://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
}

// -- SETUP UNISWAP/CAMELOT CONTRACTS -- //
const uniswap = {
  name: "Uniswap V3",
  factory: new ethers.Contract(config.UNISWAP.FACTORY_V3, IUniswapV3Factory.abi, provider),
  quoter: new ethers.Contract(config.UNISWAP.QUOTER_V3, IQuoter.abi, provider),
  router: new ethers.Contract(config.UNISWAP.ROUTER_V3, ISwapRouter.abi, provider)
}

const camelot = {
  name: "Camelot V3",
  factory: new ethers.Contract(config.CAMELOT.FACTORY_V3, IAlgebraFactory.abi, provider),
  quoter: new ethers.Contract(config.CAMELOT.QUOTER_V3, IQuoter.abi, provider),
  router: new ethers.Contract(config.CAMELOT.ROUTER_V3, ISwapRouter.abi, provider)
}

// Arbitrage contract - only load if deployed and artifacts exist
let arbitrage = null
if (config.PROJECT_SETTINGS.isDeployed) {
  try {
    const IArbitrage = require('../artifacts/contracts/Arbitrage.sol/Arbitrage.json')
    arbitrage = new ethers.Contract(config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS, IArbitrage.abi, provider)
  } catch (error) {
    console.log("⚠️ Arbitrage contract artifacts not found. Running in monitoring mode only.")
    console.log("   To enable trading, deploy the contract and ensure artifacts are available.")
    // Create a minimal ABI for the arbitrage contract if needed
    const arbitrageABI = [
      "function executeTrade(address[] calldata routers, address[] calldata tokens, uint24 fee, uint256 amountIn) external"
    ]
    arbitrage = new ethers.Contract(config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS, arbitrageABI, provider)
  }
}

module.exports = {
  provider,
  uniswap,
  camelot,
  arbitrage
}