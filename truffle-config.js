try {
  require("dotenv").config();
} catch {
  // dotenv is optional for local development
}

module.exports = {

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "1337"
    },

    sepolia: {
      provider: () => {
        const HDWalletProvider = require("@truffle/hdwallet-provider");
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        const rpcUrl = process.env.SEPOLIA_RPC_URL;

        if (!privateKey || !rpcUrl) {
          throw new Error(
            "Missing DEPLOYER_PRIVATE_KEY or SEPOLIA_RPC_URL in .env file"
          );
        }

        return new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: rpcUrl,
          numberOfAddresses: 1,
          shareNonce: true,
        });
      },
      network_id: 11155111,
      gas: 4500000,
      gasPrice: 10000000000, // 10 Gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  compilers: {
    solc: {
      version: "0.8.21",

      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },

        viaIR: true
      }
    }
  }

};