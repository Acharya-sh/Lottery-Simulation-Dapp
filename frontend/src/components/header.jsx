import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { truncateAddress } from "../services/web3Service";
import { fetchUserNotifications } from "../services/lotteryService";

function Header({ pageTitle, onMenuClick, onNavigate }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const {
    account,
    networkName,
    isCorrectNetwork,
    isConnected,
    isConnecting,
    connectWallet,
    switchNetwork,
    contract,
    web3,
  } = useWeb3();

  const loadNotifications = useCallback(async () => {
    if (!contract || !account) {
      setNotifications([]);
      return;
    }
    try {
      setLoadingNotifications(true);
      const list = await fetchUserNotifications(contract, web3, account);
      setNotifications(list);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, [contract, web3, account]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadNotifications();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleWalletClick = () => {
    if (!isCorrectNetwork && isConnected) {
      // Prompt switch to local ganache or sepolia
      switchNetwork(1337);
    } else if (onNavigate) {
      onNavigate("profile");
    }
  };

  const handleNotificationClick = (n) => {
    setShowNotifications(false);
    if (onNavigate) {
      if (n.id.startsWith("won-")) {
        onNavigate("claim");
      } else if (n.id.startsWith("full-") || n.id.startsWith("winner-drawn-")) {
        onNavigate("dashboard");
      } else if (n.id.startsWith("cancelled-")) {
        onNavigate("history");
      }
    }
  };

  return (
    <header className="header">
      {/* ================================
          HEADER LEFT
      ================================= */}
      <div className="header-left">
        {/* Hamburger */}
        <button
          type="button"
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* LSD Logo */}
        <img
          src="/logo_lsd.png"
          alt="LSD"
          className="header-logo"
        />

        {/* Page Title */}
        <h1>{pageTitle}</h1>
      </div>

      {/* ================================
          HEADER RIGHT
      ================================= */}
      <div className="header-actions">
        {/* Responsive Wallet Pill */}
        {isConnected ? (
          <div
            className={`wallet-pill ${isCorrectNetwork ? "connected" : "wrong-network"}`}
            onClick={handleWalletClick}
            title={
              isCorrectNetwork
                ? `${networkName} • ${account} (Click to view profile)`
                : "Unsupported network - click to switch to Ganache"
            }
            role="button"
            tabIndex={0}
          >
            <span className="status-dot"></span>
            <span className="wallet-network">{isCorrectNetwork ? networkName : "Wrong Network"}</span>
            <span className="wallet-address">{truncateAddress(account)}</span>
          </div>
        ) : (
          <button
            type="button"
            className="wallet-pill-btn"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            <span className="wallet-btn-icon">🦊</span>
            <span className="wallet-btn-label">{isConnecting ? "Connecting..." : "Connect"}</span>
          </button>
        )}

        {/* Notification Wrapper */}
        <div className="notification-wrapper">
          {/* Notification Button */}
          <button
            type="button"
            className="notification-btn"
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                loadNotifications();
              }
            }}
          >
            🔔
            {unreadCount > 0 && <span className="notification-badge" />}
          </button>

          {/* ================================
              NOTIFICATION POPUP
          ================================= */}
          {showNotifications && (
            <div className="notification-popup">
              <div className="notification-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: "rgba(212, 175, 55, 0.2)",
                        color: "#d4af37",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 7px",
                        borderRadius: "10px",
                        border: "1px solid rgba(212, 175, 55, 0.4)",
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="notification-close"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                >
                  ×
                </button>
              </div>

              <div className="notification-content">
                {loadingNotifications ? (
                  <div className="no-notifications" style={{ padding: "30px 16px" }}>
                    <div className="no-notification-icon" style={{ animation: "spin 1s linear infinite" }}>
                      ↻
                    </div>
                    <h4>Syncing on-chain activity...</h4>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="no-notifications">
                    <div className="no-notification-icon">🔔</div>
                    <h4>No new notifications</h4>
                    <p>
                      {isConnected
                        ? "You're all caught up with your on-chain lotteries."
                        : "Connect wallet to see your lottery alerts."}
                    </p>
                  </div>
                ) : (
                  <div className="notification-list">
                    {notifications.map((notification) => (
                      <div
                        className="notification-item"
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                          cursor: "pointer",
                          background: notification.unread
                            ? "rgba(212, 175, 55, 0.05)"
                            : "transparent",
                          borderLeft: notification.unread
                            ? "3px solid #d4af37"
                            : "3px solid transparent",
                          transition: "background 0.2s ease",
                        }}
                      >
                        <div className="notification-item-icon">
                          {notification.icon || "🔔"}
                        </div>
                        <div className="notification-item-text">
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                          <small>{notification.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;