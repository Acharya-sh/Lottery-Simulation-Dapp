import { useState } from "react";
import "./Profile.css";

function Profile() {
  const [copied, setCopied] = useState(false);

  // Temporary wallet data
  const walletAddress = "0xA3F2...9D1c";
  const fullWalletAddress =
    "0xA3F2B8C91D5E4F728A6C3B9E12F7A89D9D1c";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullWalletAddress);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Unable to copy wallet address:", error);
    }
  };

  const handleDisconnect = () => {
    // Temporary UI behavior.
    // Real MetaMask disconnect will be implemented later.
    alert("Wallet disconnect will be connected to MetaMask later.");
  };

  return (
    <div className="profile-page">

      {/* PAGE INTRO */}
      <div className="profile-intro">
        <h2>
          Profile / <span>Wallet</span>
        </h2>

        <p>
          Manage your wallet and view your connection details.
        </p>
      </div>


      {/* CONNECTED WALLET */}
      <section className="wallet-card connected-wallet">

        <div className="wallet-icon">
          <span>🦊</span>
        </div>

        <div className="connected-wallet-info">

          <span className="wallet-label">
            CONNECTED WALLET
          </span>

          <div className="wallet-address-row">

            <strong>
              {walletAddress}
            </strong>

            <button
              type="button"
              className="copy-small"
              onClick={handleCopy}
              title="Copy wallet address"
            >
              ⧉
            </button>

          </div>

          <div className="connected-status">
            <span className="status-dot"></span>
            Connected
          </div>

        </div>

      </section>


      {/* WALLET BALANCE */}
      <section className="wallet-card balance-card">

        <div className="balance-content">

          <span className="balance-label">
            WALLET BALANCE
          </span>

          <div className="balance-value">

            <span className="eth-icon">
              ◆
            </span>

            <strong>
              12.45 TEST ETH
            </strong>

          </div>

        </div>

      </section>


      {/* NETWORK */}
      <section className="wallet-card info-card">

        <span className="info-label">
          NETWORK
        </span>

        <strong>
          Sepolia
        </strong>

      </section>


      {/* WALLET TYPE */}
      <section className="wallet-card info-card">

        <span className="info-label">
          WALLET
        </span>

        <strong>
          MetaMask
        </strong>

      </section>


      {/* WALLET ADDRESS */}
      <section className="wallet-card address-card">

        <div className="address-content">

          <span className="info-label">
            WALLET ADDRESS
          </span>

          <strong>
            {walletAddress}
          </strong>

        </div>

        <button
          type="button"
          className={`copy-button ${copied ? "copied" : ""}`}
          onClick={handleCopy}
        >
          <span>
            {copied ? "✓" : "⧉"}
          </span>

          {copied ? "Copied" : "Copy"}
        </button>

      </section>


      {/* DISCONNECT */}
      <div className="disconnect-container">

        <button
          type="button"
          className="disconnect-button"
          onClick={handleDisconnect}
        >
          <span className="disconnect-icon">
            ⏻
          </span>

          Disconnect Wallet
        </button>

      </div>

    </div>
  );
}

export default Profile;