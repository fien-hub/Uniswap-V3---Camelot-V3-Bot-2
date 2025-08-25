require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")

const privateKey = process.env.PRIVATE_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      forking: {
        url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        blockNumber: 345636000
      },
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: [privateKey],
      chainId: 42161,
      gasPrice: 100000000, // 0.1 gwei
    }
  }
};
