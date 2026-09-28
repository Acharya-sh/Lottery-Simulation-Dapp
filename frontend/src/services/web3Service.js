import Web3 from "web3";
import LotteryArtifact from "../contracts/Lottery.json";

export const SUPPORTED_CHAINS = {
  1337: {
    id: 1337,
    hexId: "0x539",
    name: "Ganache Local (1337)",
    currency: "ETH",
    rpcUrls: ["http://127.0.0.1:8545"],
  },
  11155111: {
    id: 11155111,
    hexId: "0xaa36a7",
    name: "Sepolia Testnet",
    currency: "SepoliaETH",
    rpcUrls: [
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://rpc.sepolia.org",
      "https://rpc2.sepolia.org",
    ],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

/**
 * Returns human-readable name for a given chainId
 */
export const getNetworkName = (chainId) => {
  if (!chainId) return "Unknown Network";
  const numId = Number(chainId);
  if (SUPPORTED_CHAINS[numId]) {
    return SUPPORTED_CHAINS[numId].name;
  }
  if (numId === 1) return "Ethereum Mainnet";
  if (numId === 5) return "Goerli (Deprecated)";
  if (numId === 5777) return "Ganache (5777)";
  return `Network #${numId}`;
};

/**
 * Checks if the given chainId is supported
 */
export const isSupportedNetwork = (chainId) => {
  if (!chainId) return false;
  const numId = Number(chainId);
  return Boolean(SUPPORTED_CHAINS[numId]);
};

/**
 * Formats a wallet address into truncated form (0x1234...abcd)
 */
export const truncateAddress = (address) => {
  if (!address || typeof address !== "string") return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Formats a balance from Wei to readable ETH string
 */
export const formatEthBalance = (balanceInWei) => {
  if (!balanceInWei) return "0.00";
  try {
    const eth = Web3.utils.fromWei(balanceInWei.toString(), "ether");
    const num = parseFloat(eth);
    if (isNaN(num)) return "0.00";
    return num.toFixed(4);
  } catch (err) {
    console.error("Error formatting balance:", err);
    return "0.00";
  }
};

/**
 * Instantiates the Web3 contract using the local artifact or optional env override
 */
export const getLotteryContract = (web3Instance, chainId) => {
  if (!web3Instance) return null;

  try {
    const numId = Number(chainId);
    const envAddress = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS;

    let contractAddress = null;

    if (envAddress && Web3.utils.isAddress(envAddress)) {
      contractAddress = envAddress;
    } else if (LotteryArtifact.networks && LotteryArtifact.networks[numId]) {
      contractAddress = LotteryArtifact.networks[numId].address;
    }

    if (!contractAddress) {
      return null;
    }

    return new web3Instance.eth.Contract(LotteryArtifact.abi, contractAddress);
  } catch (err) {
    console.error("Error creating contract instance:", err);
    return null;
  }
};

/**
 * Requests network switch in MetaMask
 */
export const requestSwitchNetwork = async (targetChainId) => {
  if (!window.ethereum) throw new Error("MetaMask is not installed");

  const targetConfig = SUPPORTED_CHAINS[Number(targetChainId)];
  if (!targetConfig) throw new Error(`Unsupported target chain ID: ${targetChainId}`);

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetConfig.hexId }],
    });
  } catch (switchError) {
    // Error code 4902 means the chain hasn't been added to MetaMask yet
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: targetConfig.hexId,
            chainName: targetConfig.name,
            rpcUrls: targetConfig.rpcUrls,
            nativeCurrency: {
              name: targetConfig.currency,
              symbol: targetConfig.currency,
              decimals: 18,
            },
            blockExplorerUrls: targetConfig.blockExplorerUrls || [],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};
