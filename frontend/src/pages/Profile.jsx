import { useState, useEffect, useCallback } from "react";
import "./Profile.css";
import { useWeb3 } from "../context/Web3Context";
import { truncateAddress } from "../services/web3Service";
import { fetchAllLotteries } from "../services/lotteryService";

function Profile() {
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [stats, setStats] = useState({
    created: 0,
    entered: 0,
    won: 0,
    claimed: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const {
    account,
    balance,
    chainId,
    networkName,
    isCorrectNetwork,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    contract,
    contractAddress,
    web3,
    refreshBalance,
  } = useWeb3();

  // Fetch on-chain user statistics
  const loadUserStats = useCallback(async () => {
    if (!contract || !account) {
      setStats({ created: 0, entered: 0, won: 0, claimed: 0 });
      return;
    }
    try {
      setLoadingStats(true);
      const lotteries = await fetchAllLotteries(contract, web3);
      const accLower = account.toLowerCase();

      let created = 0;
      let entered = 0;
      let won = 0;
      let claimed = 0;

      for (const l of lotteries) {
        if (l.creator && l.creator.toLowerCase() === accLower) {
          created++;
        }
        if (l.participantAddresses && l.participantAddresses.includes(accLower)) {
          entered++;
        }
        if (l.winner && l.winner.toLowerCase() === accLower) {
          won++;
          if (l.prizeClaimed) {
            claimed++;
          }
        }
      }

      setStats({ created, entered, won, claimed });
    } catch (err) {
      console.warn("Failed to load on-chain user stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [contract, account, web3]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadUserStats();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadUserStats]);

  const handleCopyWallet = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 1800);
    } catch (error) {
      console.error("Unable to copy wallet address:", error);
    }
  };

  const handleCopyContract = async () => {
    if (!contractAddress) return;
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 1800);
    } catch (error) {
      console.error("Unable to copy contract address:", error);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      await refreshBalance();
      await loadUserStats();
    } finally {
      setTimeout(() => setIsRefreshingBalance(false), 500);
    }
  };

  if (!isConnected) {
    return (
      <div className="profile-page">
        <div className="profile-intro">
          <h2>
            Profile / <span>Wallet</span>
          </h2>
          <p>Connect your wallet to view account balance, smart contract details, and on-chain activity.</p>
        </div>

        <section className="wallet-card connected-wallet" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div className="wallet-icon" style={{ margin: "0 auto 16px" }}>
            <span>🦊</span>
          </div>
          <h3 style={{ marginBottom: "12px", color: "#ffffff" }}>No Wallet Connected</h3>
          <p style={{ color: "#888888", marginBottom: "24px", fontSize: "14px" }}>
            Please connect your MetaMask wallet to interact with lotteries on-chain.
          </p>
          <button
            type="button"
            className="disconnect-button"
            style={{
              background: "linear-gradient(135deg, #d4a926 0%, #b8860b 100%)",
              color: "#050505",
              borderColor: "#e6b91e",
              margin: "0 auto",
              maxWidth: "240px",
              cursor: "pointer",
            }}
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* PAGE INTRO */}
      <div className="profile-intro">
        <h2>
          Profile / <span>Wallet</span>
        </h2>
        <p>Manage your connected wallet, review smart contract details, and check on-chain activity.</p>
      </div>

      {/* CONNECTED WALLET */}
      <section className="wallet-card connected-wallet">
        <div className="wallet-icon">
          <span>🦊</span>
        </div>

        <div className="connected-wallet-info">
          <span className="wallet-label">CONNECTED WALLET</span>

          <div className="wallet-address-row">
            <strong>{truncateAddress(account)}</strong>

            <button
              type="button"
              className="copy-small"
              onClick={handleCopyWallet}
              title="Copy wallet address"
            >
              {copiedWallet ? "✓" : "⧉"}
            </button>
          </div>

          <div className="connected-status">
            <span
              className="status-dot"
              style={{
                background: isCorrectNetwork ? "#22c55e" : "#ef4444",
                boxShadow: isCorrectNetwork ? "0 0 8px #22c55e" : "0 0 8px #ef4444",
              }}
            ></span>
            {isCorrectNetwork ? "Connected to " + networkName : "Wrong Network"}
          </div>
        </div>
      </section>

      {/* WALLET BALANCE */}
      <section className="wallet-card balance-card">
        <div className="balance-content">
          <span className="balance-label">WALLET BALANCE</span>

          <div className="balance-value">
            <span className="eth-icon">◆</span>
            <strong>{balance} TEST ETH</strong>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={handleRefreshBalance}
            disabled={isRefreshingBalance}
            title="Refresh balance and stats from blockchain"
          >
            <span className={`refresh-icon ${isRefreshingBalance ? "spinning" : ""}`}>↻</span>
            {isRefreshingBalance ? "Refreshing..." : "Refresh Balance"}
          </button>
        </div>
      </section>

      {/* ON-CHAIN ACTIVITY STATS */}
      <section className="wallet-card info-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span className="info-label" style={{ fontWeight: "700", color: "#d4af37" }}>
            ON-CHAIN ACTIVITY STATS
          </span>
          {loadingStats && (
            <span style={{ fontSize: "12px", color: "#888888" }}>Syncing...</span>
          )}
        </div>

        <div className="profile-stats-grid">
          <div className="stat-tile">
            <span className="stat-number">{stats.created}</span>
            <span className="stat-label">Created Lotteries</span>
          </div>

          <div className="stat-tile">
            <span className="stat-number">{stats.entered}</span>
            <span className="stat-label">Entered Lotteries</span>
          </div>

          <div className="stat-tile">
            <span className="stat-number" style={{ color: "#22c55e" }}>{stats.won}</span>
            <span className="stat-label">Won Lotteries</span>
          </div>

          <div className="stat-tile">
            <span className="stat-number" style={{ color: "#d4af37" }}>{stats.claimed}</span>
            <span className="stat-label">Prizes Claimed</span>
          </div>
        </div>
      </section>

      {/* SMART CONTRACT INFORMATION */}
      <section className="wallet-card address-card">
        <div className="address-content">
          <span className="info-label">DEPLOYED SMART CONTRACT (LOTTERY)</span>
          {contractAddress ? (
            <strong style={{ wordBreak: "break-all", fontSize: "14px", marginTop: "8px" }}>
              {contractAddress}
            </strong>
          ) : (
            <strong style={{ color: "#ef4444", fontSize: "14px", marginTop: "8px" }}>
              Not deployed on {networkName || "current network"}
            </strong>
          )}
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#888888" }}>
            Network: <span style={{ color: "#e5b83e" }}>{networkName}</span> {chainId && `(Chain ID: ${chainId})`}
          </div>
        </div>

        {contractAddress && (
          <button
            type="button"
            className={`copy-button ${copiedContract ? "copied" : ""}`}
            onClick={handleCopyContract}
          >
            <span>{copiedContract ? "✓" : "⧉"}</span>
            {copiedContract ? "Copied" : "Copy"}
          </button>
        )}
      </section>

      {/* NETWORK SWITCHING */}
      <section className="wallet-card info-card">
        <span className="info-label">SUPPORTED NETWORKS</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
          <button
            type="button"
            onClick={() => switchNetwork(1337)}
            style={{
              background: chainId === 1337 ? "rgba(212, 169, 38, 0.25)" : "rgba(255, 255, 255, 0.05)",
              border: chainId === 1337 ? "1px solid #d4a926" : "1px solid #333333",
              color: chainId === 1337 ? "#e6b91e" : "#aaaaaa",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ● Ganache Local (1337) {chainId === 1337 && "✓ Active"}
          </button>

          <button
            type="button"
            onClick={() => switchNetwork(11155111)}
            style={{
              background: chainId === 11155111 ? "rgba(212, 169, 38, 0.25)" : "rgba(255, 255, 255, 0.05)",
              border: chainId === 11155111 ? "1px solid #d4a926" : "1px solid #333333",
              color: chainId === 11155111 ? "#e6b91e" : "#aaaaaa",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ● Ethereum Sepolia (11155111) {chainId === 11155111 && "✓ Active"}
          </button>
        </div>
      </section>

      {/* FULL WALLET ADDRESS */}
      <section className="wallet-card address-card">
        <div className="address-content">
          <span className="info-label">FULL WALLET ADDRESS</span>
          <strong style={{ wordBreak: "break-all", fontSize: "14px" }}>
            {account}
          </strong>
        </div>

        <button
          type="button"
          className={`copy-button ${copiedWallet ? "copied" : ""}`}
          onClick={handleCopyWallet}
        >
          <span>{copiedWallet ? "✓" : "⧉"}</span>
          {copiedWallet ? "Copied" : "Copy"}
        </button>
      </section>

      {/* SEPOLIA FAUCET & ACADEMIC GUIDE CARD */}
      <section className="wallet-card faucet-guide-card">
        <div className="faucet-guide-header">
          <span className="faucet-guide-badge">ACADEMIC SIMULATION</span>
          <h3>Sepolia Testnet & Faucet Guide</h3>
        </div>
        <p className="faucet-guide-desc">
          This decentralized application is strictly for academic research and testing. It operates exclusively on local testnets (Ganache) and the Ethereum Sepolia public testnet. <strong>Never send real mainnet Ethereum funds</strong> to this contract.
        </p>

        <div className="faucet-links">
          <a
            href="https://sepolia-faucet.pk910.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="faucet-link-btn"
          >
            <span>⛏</span> Sepolia PoW Faucet ↗
          </a>
          <a
            href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
            target="_blank"
            rel="noopener noreferrer"
            className="faucet-link-btn"
          >
            <span>☁</span> Google Cloud Web3 Faucet ↗
          </a>
          <a
            href="https://www.infura.io/faucet/sepolia"
            target="_blank"
            rel="noopener noreferrer"
            className="faucet-link-btn"
          >
            <span>⚡</span> Infura Sepolia Faucet ↗
          </a>
          <a
            href="https://sepoliafaucet.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="faucet-link-btn"
          >
            <span>🧪</span> Alchemy Sepolia Faucet ↗
          </a>
        </div>
      </section>

      {/* DISCONNECT */}
      <div className="disconnect-container">
        <button
          type="button"
          className="disconnect-button"
          onClick={disconnectWallet}
        >
          <span className="disconnect-icon">⏻</span>
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}

export default Profile;