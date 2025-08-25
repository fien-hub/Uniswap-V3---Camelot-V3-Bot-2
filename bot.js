// -- HANDLE INITIAL SETUP -- //
require("dotenv").config()
require('./helpers/server')

const Big = require('big.js')

const ethers = require("ethers")
const config = require('./config.json')
const { getTokenAndContract, getPoolContract, getPoolLiquidity, calculatePrice } = require('./helpers/helpers')
const { provider, uniswap, camelot, arbitrage } = require('./helpers/initialization')

// -- CONFIGURATION VALUES HERE -- //
const ARB_FOR = config.TOKENS.ARB_FOR
const ARB_AGAINST = config.TOKENS.ARB_AGAINST
const POOL_FEE = config.TOKENS.POOL_FEE
const UNITS = config.PROJECT_SETTINGS.PRICE_UNITS
const PRICE_DIFFERENCE = config.PROJECT_SETTINGS.PRICE_DIFFERENCE
const GAS_LIMIT = config.PROJECT_SETTINGS.GAS_LIMIT
const GAS_PRICE = config.PROJECT_SETTINGS.GAS_PRICE

let isExecuting = false

const main = async () => {
  console.log("🚀 Starting Multi-Pair Arbitrage Bot")
  console.log("📊 Monitoring Uniswap V3 vs Camelot V3 on Arbitrum\n")

  const tokenPairs = config.TOKEN_PAIRS
  const activePairs = []

  for (const pair of tokenPairs) {
    try {
      console.log(`Setting up ${pair.name}...`)

      const { token0, token1 } = await getTokenAndContract(pair.token0, pair.token1, provider)
      const uPool = await getPoolContract(uniswap, token0.address, token1.address, pair.fee, provider)
      const cPool = await getPoolContract(camelot, token0.address, token1.address, pair.fee, provider)

      console.log(`  ✅ ${pair.name} - Uniswap: ${await uPool.getAddress()}`)
      console.log(`  ✅ ${pair.name} - Camelot: ${await cPool.getAddress()}`)

      // Set up event listeners for this pair
      uPool.on('Swap', () => eventHandler(uPool, cPool, token0, token1, pair.name))
      cPool.on('Swap', () => eventHandler(uPool, cPool, token0, token1, pair.name))

      activePairs.push({
        name: pair.name,
        token0,
        token1,
        uPool,
        cPool,
        fee: pair.fee
      })

    } catch (error) {
      console.log(`  ❌ Failed to set up ${pair.name}: ${error.message}`)
    }
  }

  console.log(`\n🎯 Successfully monitoring ${activePairs.length} token pairs`)
  console.log("⏳ Waiting for arbitrage opportunities...\n")
}

const eventHandler = async (_uPool, _cPool, _token0, _token1, _pairName) => {
  if (!isExecuting) {
    isExecuting = true

    const priceDifference = await checkPrice([_uPool, _cPool], _token0, _token1, _pairName)
    const exchangePath = await determineDirection(priceDifference)

    if (!exchangePath) {
      console.log(`No Arbitrage Currently Available for ${_pairName}\n`)
      console.log(`-----------------------------------------\n`)
      isExecuting = false
      return
    }

    const { isProfitable, amount } = await determineProfitability(exchangePath, _token0, _token1)

    if (!isProfitable) {
      console.log(`No Arbitrage Currently Available for ${_pairName}\n`)
      console.log(`-----------------------------------------\n`)
      isExecuting = false
      return
    }

    const receipt = await executeTrade(exchangePath, _token0, _token1, amount)

    isExecuting = false

    console.log("\nWaiting for swap event...\n")
  }
}

const checkPrice = async (_pools, _token0, _token1, _pairName) => {
  isExecuting = true

  console.log(`💱 Swap Detected for ${_pairName}, Checking Price...\n`)

  const currentBlock = await provider.getBlockNumber()

  const uPrice = await calculatePrice(_pools[0], _token0, _token1, "Uniswap V3")
  const cPrice = await calculatePrice(_pools[1], _token0, _token1, "Camelot V3")

  const uFPrice = Number(uPrice).toFixed(UNITS)
  const cFPrice = Number(cPrice).toFixed(UNITS)
  const priceDifference = (((uFPrice - cFPrice) / cFPrice) * 100).toFixed(2)

  console.log(`Current Block: ${currentBlock}`)
  console.log(`-----------------------------------------`)
  console.log(`UNISWAP | ${_token1.symbol}/${_token0.symbol}   | ${uFPrice}`)
  console.log(`CAMELOT | ${_token1.symbol}/${_token0.symbol}   | ${cFPrice}\n`)
  console.log(`Percentage Difference: ${priceDifference}%\n`)

  return priceDifference
}

const determineDirection = async (_priceDifference) => {
  console.log(`🎯 Determining Direction...\n`)

  if (_priceDifference >= PRICE_DIFFERENCE) {

    console.log(`📈 Potential Arbitrage Direction:\n`)
    console.log(`Buy\t -->\t ${uniswap.name}`)
    console.log(`Sell\t -->\t ${camelot.name}\n`)
    return [uniswap, camelot]

  } else if (_priceDifference <= -(PRICE_DIFFERENCE)) {

    console.log(`📈 Potential Arbitrage Direction:\n`)
    console.log(`Buy\t -->\t ${camelot.name}`)
    console.log(`Sell\t -->\t ${uniswap.name}\n`)
    return [camelot, uniswap]

  } else {
    return null
  }
}

const determineProfitability = async (_exchangePath, _token0, _token1) => {
  console.log(`Determining Profitability...\n`)

  // This is where you can customize your conditions on whether a profitable trade is possible...

  /**
   * The helper file has quite a few functions that come in handy
   * for performing specifc tasks.
   */

  try {
    // Fetch liquidity off of the exchange to buy token1 from
    const liquidity = await getPoolLiquidity(_exchangePath[0].factory, _token0, _token1, POOL_FEE, provider)

    // An example of using a percentage of the liquidity
    // BigInt doesn't like decimals, so we use Big.js here
    const percentage = Big(0.5)
    const minAmount = Big(liquidity[1]).mul(percentage)

    // Figure out how much token0 needed for X amount of token1...
    const quoteExactOutputSingleParams = {
      tokenIn: _token0.address,
      tokenOut: _token1.address,
      fee: POOL_FEE,
      amount: BigInt(minAmount.round().toFixed(0)),
      sqrtPriceLimitX96: 0
    }

    const [token0Needed] = await _exchangePath[0].quoter.quoteExactOutputSingle.staticCall(
      quoteExactOutputSingleParams
    )

    // Figure out how much token0 returned after swapping X amount of token1
    const quoteExactInputSingleParams = {
      tokenIn: _token1.address,
      tokenOut: _token0.address,
      fee: POOL_FEE,
      amountIn: BigInt(minAmount.round().toFixed(0)),
      sqrtPriceLimitX96: 0
    }

    const [token0Returned] = await _exchangePath[1].quoter.quoteExactInputSingle.staticCall(
      quoteExactInputSingleParams
    )

    const amountIn = ethers.formatUnits(token0Needed, _token0.decimals)
    const amountOut = ethers.formatUnits(token0Returned, _token0.decimals)

    console.log(`Estimated amount of ${_token0.symbol} needed to buy ${_token1.symbol} on ${_exchangePath[0].name}: ${amountIn}`)
    console.log(`Estimated amount of ${_token0.symbol} returned after swapping ${_token1.symbol} on ${_exchangePath[1].name}: ${amountOut}\n`)

    const amountDifference = amountOut - amountIn
    const estimatedGasCost = GAS_LIMIT * GAS_PRICE

    // Fetch account
    const account = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const ethBalanceBefore = ethers.formatUnits(await provider.getBalance(account.address), 18)
    const ethBalanceAfter = ethBalanceBefore - estimatedGasCost

    const wethBalanceBefore = Number(ethers.formatUnits(await _token0.contract.balanceOf(account.address), _token0.decimals))
    const wethBalanceAfter = amountDifference + wethBalanceBefore
    const wethBalanceDifference = wethBalanceAfter - wethBalanceBefore

    const data = {
      'ETH Balance Before': ethBalanceBefore,
      'ETH Balance After': ethBalanceAfter,
      'ETH Spent (gas)': estimatedGasCost,
      '-': {},
      'WETH Balance BEFORE': wethBalanceBefore,
      'WETH Balance AFTER': wethBalanceAfter,
      'WETH Gained/Lost': wethBalanceDifference,
      '-': {},
      'Total Gained/Lost': wethBalanceDifference - estimatedGasCost
    }

    console.table(data)
    console.log()

    // Setup conditions...

    if (Number(amountOut) < Number(amountIn)) {
      throw new Error("Not enough to pay back flash loan")
    }

    if (Number(ethBalanceAfter) < 0) {
      throw new Error("Not enough ETH for gas fee")
    }

    return { isProfitable: true, amount: ethers.parseUnits(amountIn, _token0.decimals) }

  } catch (error) {
    console.log(error)
    console.log("")
    return { isProfitable: false, amount: 0 }
  }
}

const executeTrade = async (_exchangePath, _token0, _token1, _amount) => {
  console.log(`Attempting Arbitrage...\n`)

  const routerPath = [
    await _exchangePath[0].router.getAddress(),
    await _exchangePath[1].router.getAddress()
  ]

  const tokenPath = [
    _token0.address,
    _token1.address
  ]

  // Create Signer
  const account = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  // Fetch token balances before
  const tokenBalanceBefore = await _token0.contract.balanceOf(account.address)
  const ethBalanceBefore = await provider.getBalance(account.address)

  if (config.PROJECT_SETTINGS.isDeployed && arbitrage) {
    const transaction = await arbitrage.connect(account).executeTrade(
      routerPath,
      tokenPath,
      POOL_FEE,
      _amount
    )

    const receipt = await transaction.wait(0)
    console.log(`Transaction Hash: ${receipt.hash}`)
  } else {
    if (!arbitrage) {
      console.log(`⚠️ Arbitrage Contract Not Available - Running in Monitoring Mode Only`)
      console.log(`💡 Profitable opportunity detected but cannot execute trade`)
    } else {
      console.log(`Arbitrage Contract Not Deployed, Skipping Trade...`)
    }
  }

  console.log(`Trade Complete:\n`)

  // Fetch token balances after
  const tokenBalanceAfter = await _token0.contract.balanceOf(account.address)
  const ethBalanceAfter = await provider.getBalance(account.address)

  const tokenBalanceDifference = tokenBalanceAfter - tokenBalanceBefore
  const ethBalanceDifference = ethBalanceBefore - ethBalanceAfter

  const data = {
    'ETH Balance Before': ethers.formatUnits(ethBalanceBefore, 18),
    'ETH Balance After': ethers.formatUnits(ethBalanceAfter, 18),
    'ETH Spent (gas)': ethers.formatUnits(ethBalanceDifference.toString(), 18),
    '-': {},
    'WETH Balance BEFORE': ethers.formatUnits(tokenBalanceBefore, _token0.decimals),
    'WETH Balance AFTER': ethers.formatUnits(tokenBalanceAfter, _token0.decimals),
    'WETH Gained/Lost': ethers.formatUnits(tokenBalanceDifference.toString(), _token0.decimals),
    '-': {},
    'Total Gained/Lost': `${ethers.formatUnits((tokenBalanceDifference - ethBalanceDifference).toString(), _token0.decimals)}`
  }

  console.table(data)
}

main()