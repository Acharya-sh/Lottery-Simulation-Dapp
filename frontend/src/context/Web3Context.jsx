import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import Web3 from "web3";
import {
  getNetworkName,
  isSupportedNetwork,
  formatEthBalance,
  getLotteryContract,
  requestSwitchNetwork,
  SUPPORTED_CHAINS,
} from "../services/web3Service";
import LotteryArtifact from "../contracts/Lottery.json";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0.00");
  const [balanceWei, setBalanceWei] = useState("0");
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState("Not Connected");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [web3Instance, setWeb3Instance] = useState(null);

  const isMetaMaskInstalled = typeof window !== "undefined" && Boolean(window.ethereum);

  // Check if current network has a deployed contract address or is supported
  const isCorrectNetwork = useMemo(() => {
    if (!chainId) return false;
    return isSupportedNetwork(chainId);
  }, [chainId]);

  // Derive contract instance whenever web3Instance or chainId changes
  const contract = useMemo(() => {
    if (!web3Instance || !chainId) return null;
    return getLotteryContract(web3Instance, chainId);
  }, [web3Instance, chainId]);

  const contractAddress = useMemo(() => {
    if (!chainId) return null;
    const numId = Number(chainId);
    const envAddress = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS;
    if (envAddress && Web3.utils.isAddress(envAddress)) return envAddress;
    if (LotteryArtifact.networks && LotteryArtifact.networks[numId]) {
      return LotteryArtifact.networks[numId].address;
    }
    return null;
  }, [chainId]);

  /**
   * Refreshes the active account's balance
   */
  const refreshBalance = useCallback(
    async (acc = account, web3Inst = web3Instance) => {
      if (!acc || !web3Inst) return;
      try {
        const rawWei = await web3Inst.eth.getBalance(acc);
        setBalanceWei(rawWei.toString());
        setBalance(formatEthBalance(rawWei));
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    },
    [account, web3Instance]
  );

  /**
   * Connects MetaMask
   */
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      // If mobile device without injected provider, offer to open MetaMask App
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        const currentUrl = window.location.host + window.location.pathname;
        window.open(`https://metamask.app.link/dapp/${currentUrl}`, "_blank");
        return;
      }
      setError("MetaMask is not installed. Please install MetaMask to use this DApp.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const web3 = new Web3(window.ethereum);
      setWeb3Instance(web3);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask.");
      }

      const activeAccount = accounts[0];
      setAccount(activeAccount);

      const rawChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      const parsedChainId = parseInt(rawChainId, 16);
      setChainId(parsedChainId);
      setNetworkName(getNetworkName(parsedChainId));

      await refreshBalance(activeAccount, web3);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      if (err.code === 4001) {
        setError("Connection request rejected in MetaMask.");
      } else {
        setError(err.message || "Failed to connect MetaMask.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled, refreshBalance]);

  /**
   * Disconnects current wallet state in DApp
   */
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance("0.00");
    setBalanceWei("0");
    setChainId(null);
    setNetworkName("Not Connected");
    setError(null);
  }, []);

  /**
   * Switches network to a target supported chain
   */
  const switchNetwork = useCallback(async (targetChainId) => {
    try {
      setError(null);
      await requestSwitchNetwork(targetChainId);
    } catch (err) {
      console.error("Failed to switch network:", err);
      if (err.code === 4001) {
        setError("Network switch rejected in MetaMask.");
      } else {
        setError(err.message || "Failed to switch network.");
      }
    }
  }, []);

  // Listen to MetaMask events (accountsChanged, chainChanged)
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if (web3Instance) {
          refreshBalance(accounts[0], web3Instance);
        }
      }
    };

    const handleChainChanged = (newChainHex) => {
      const parsedChainId = parseInt(newChainHex, 16);
      setChainId(parsedChainId);
      setNetworkName(getNetworkName(parsedChainId));
      if (account && web3Instance) {
        refreshBalance(account, web3Instance);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // If already authorized, softly detect existing connection
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          const web3 = new Web3(window.ethereum);
          setWeb3Instance(web3);
          setAccount(accounts[0]);

          window.ethereum
            .request({ method: "eth_chainId" })
            .then((rawChainId) => {
              const parsedChainId = parseInt(rawChainId, 16);
              setChainId(parsedChainId);
              setNetworkName(getNetworkName(parsedChainId));
              refreshBalance(accounts[0], web3);
            })
            .catch(console.error);
        }
      })
      .catch(console.error);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [account, web3Instance, disconnectWallet, refreshBalance]);

  const value = {
    account,
    balance,
    balanceWei,
    chainId,
    networkName,
    isCorrectNetwork,
    isConnected: Boolean(account),
    isConnecting,
    isMetaMaskInstalled,
    web3: web3Instance,
    contract,
    contractAddress,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    switchNetwork,
    supportedChains: SUPPORTED_CHAINS,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
