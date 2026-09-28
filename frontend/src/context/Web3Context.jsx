import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import Web3 from "web3";
import {
  getNetworkName,
  isSupportedNetwork,
  formatEthBalance,
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

  const isMetaMaskInstalled = typeof window !== "undefined" && Boolean(window.ethereum);

  // Keep a ref to the latest account to avoid stale closures in listeners
  const accountRef = useRef(account);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  // Stable singleton Web3 instance created once
  const web3Instance = useMemo(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      return new Web3(window.ethereum);
    }
    return null;
  }, []);

  // Check if current network has a deployed contract address or is supported
  const isCorrectNetwork = useMemo(() => {
    if (!chainId) return false;
    return isSupportedNetwork(chainId);
  }, [chainId]);

  // Resolve contract address based on current chainId
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

  // Derive contract instance ONLY when web3Instance or contractAddress changes
  const contract = useMemo(() => {
    if (!web3Instance || !contractAddress) return null;
    return new web3Instance.eth.Contract(LotteryArtifact.abi, contractAddress);
  }, [web3Instance, contractAddress]);

  /**
   * Stable balance refresher
   */
  const refreshBalance = useCallback(
    async (targetAccount = accountRef.current) => {
      const acc = targetAccount || accountRef.current;
      if (!acc || !web3Instance) return;
      try {
        const rawWei = await web3Instance.eth.getBalance(acc);
        setBalanceWei(rawWei.toString());
        setBalance(formatEthBalance(rawWei));
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    },
    [web3Instance]
  );

  /**
   * Disconnects current wallet state in DApp
   */
  const disconnectWallet = useCallback(() => {
    try {
      localStorage.setItem("dapp_disconnected", "true");
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
    setAccount(null);
    setBalance("0.00");
    setBalanceWei("0");
    setChainId(null);
    setNetworkName("Not Connected");
    setError(null);
  }, []);

  /**
   * Connects MetaMask explicitly
   */
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) {
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
      // Clear disconnected flag when user explicitly requests connection
      try {
        localStorage.removeItem("dapp_disconnected");
      } catch (e) {
        console.warn("localStorage remove failed:", e);
      }

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

      await refreshBalance(activeAccount);
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

  // Listen to MetaMask events (accountsChanged, chainChanged) and initial auto-detection
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      // If user explicitly disconnected in DApp, do not automatically re-login
      const isDisconnected = localStorage.getItem("dapp_disconnected") === "true";
      if (isDisconnected) {
        return;
      }

      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        const nextAccount = accounts[0];
        if (accountRef.current?.toLowerCase() !== nextAccount.toLowerCase()) {
          setAccount(nextAccount);
          refreshBalance(nextAccount);
        }
      }
    };

    const handleChainChanged = (newChainHex) => {
      const parsedChainId = parseInt(newChainHex, 16);
      setChainId(parsedChainId);
      setNetworkName(getNetworkName(parsedChainId));
      if (accountRef.current) {
        refreshBalance(accountRef.current);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Initial silent detection: ONLY if user has NOT explicitly disconnected
    const isDisconnected = localStorage.getItem("dapp_disconnected") === "true";
    if (!isDisconnected) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then(async (accounts) => {
          if (accounts && accounts.length > 0) {
            try {
              const rawChainId = await window.ethereum.request({
                method: "eth_chainId",
              });
              const parsedChainId = parseInt(rawChainId, 16);
              setChainId(parsedChainId);
              setNetworkName(getNetworkName(parsedChainId));
              setAccount(accounts[0]);
              refreshBalance(accounts[0]);
            } catch (chainErr) {
              console.error("Error reading chain ID:", chainErr);
            }
          }
        })
        .catch((err) => {
          console.error("Auto-connect check failed:", err);
        });
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [disconnectWallet, refreshBalance]);

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
