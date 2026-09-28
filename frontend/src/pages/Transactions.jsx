import { useState, useEffect, useMemo, useCallback } from "react";
import "./Transactions.css";
import { useWeb3 } from "../context/Web3Context";
import { fetchUserTransactions } from "../services/lotteryService";

function Transactions() {
  const {
    contract,
    web3,
    account,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    switchNetwork,
  } = useWeb3();

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  /* =========================================
     FETCH ON-CHAIN TRANSACTIONS
  ========================================= */
  const loadTransactions = useCallback(async () => {
    if (!isConnected || !account) {
      setTransactions([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    if (!isCorrectNetwork) {
      setTransactions([]);
      setIsLoading(false);
      setLoadError("Unsupported network. Please switch to Ganache Local (1337) or Sepolia.");
      return;
    }

    if (!contract || !web3) {
      setTransactions([]);
      setIsLoading(false);
      setLoadError("Lottery smart contract is not available on current network.");
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchUserTransactions(contract, web3, account);
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setLoadError(err.message || "Failed to load on-chain transaction history.");
    } finally {
      setIsLoading(false);
    }
  }, [contract, web3, account, isConnected, isCorrectNetwork]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadTransactions();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadTransactions]);

  /* =========================================
     COMPUTE SUMMARY STATS
  ========================================= */
  const stats = useMemo(() => {
    let sentSum = 0;
    let receivedSum = 0;

    transactions.forEach((tx) => {
      if (tx.direction === "sent" && tx.amountNum) {
        sentSum += tx.amountNum;
      } else if (tx.direction === "received" && tx.amountNum) {
        receivedSum += tx.amountNum;
      }
    });

    return {
      sent: sentSum.toFixed(3),
      received: receivedSum.toFixed(3),
      count: transactions.length,
    };
  }, [transactions]);

  /* =========================================
     FILTER & SORT TRANSACTIONS
  ========================================= */
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const searchText = search.toLowerCase().trim();

        const matchesSearch =
          !searchText ||
          (transaction.type &&
            transaction.type.toLowerCase().includes(searchText)) ||
          (transaction.description &&
            transaction.description.toLowerCase().includes(searchText)) ||
          (transaction.hash &&
            transaction.hash.toLowerCase().includes(searchText)) ||
          (transaction.from &&
            transaction.from.toLowerCase().includes(searchText)) ||
          (transaction.to && transaction.to.toLowerCase().includes(searchText));

        const matchesTab =
          activeTab === "all" || transaction.direction === activeTab;

        const matchesType =
          typeFilter === "all" || transaction.type === typeFilter;

        return matchesSearch && matchesTab && matchesType;
      })
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return (b.timestamp || 0) - (a.timestamp || 0);
        }
        return (a.timestamp || 0) - (b.timestamp || 0);
      });
  }, [transactions, search, activeTab, typeFilter, sortOrder]);

  return (
    <div className="transactions-page">
      {/* PAGE HEADER */}
      <div className="transactions-heading">
        <div>
          <h2>Transactions</h2>
          <p>Authentic on-chain transaction history for your connected wallet.</p>
        </div>

        <div className="transactions-heading-actions">
          <button
            type="button"
            className="transactions-refresh-btn"
            onClick={loadTransactions}
            disabled={isLoading || !isConnected}
            title="Refresh transactions from blockchain"
          >
            ↻ Refresh
          </button>
          <div className="transactions-count">
            {filteredTransactions.length}{" "}
            {filteredTransactions.length === 1 ? "Record" : "Records"}
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="transaction-summary">
        <div className="transaction-stat">
          <div className="transaction-stat-icon">↑</div>
          <div className="transaction-stat-content">
            <span>Total Sent</span>
            <strong>-{stats.sent} ETH</strong>
          </div>
        </div>

        <div className="transaction-stat">
          <div className="transaction-stat-icon">↓</div>
          <div className="transaction-stat-content">
            <span>Total Received</span>
            <strong>+{stats.received} ETH</strong>
          </div>
        </div>

        <div className="transaction-stat">
          <div className="transaction-stat-icon">▤</div>
          <div className="transaction-stat-content">
            <span>Total Transactions</span>
            <strong>{stats.count}</strong>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {loadError && isConnected && isCorrectNetwork && (
        <div className="transaction-error-banner">
          <span>⚠️ {loadError}</span>
          <button
            type="button"
            className="transaction-retry-btn"
            onClick={loadTransactions}
          >
            Retry
          </button>
        </div>
      )}

      {/* SENT / RECEIVED TABS */}
      <div className="transaction-tabs">
        <button
          type="button"
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>

        <button
          type="button"
          className={activeTab === "sent" ? "active" : ""}
          onClick={() => setActiveTab("sent")}
        >
          Sent
        </button>

        <button
          type="button"
          className={activeTab === "received" ? "active" : ""}
          onClick={() => setActiveTab("received")}
        >
          Received
        </button>
      </div>

      {/* FILTERS */}
      <div className="transaction-controls">
        <div className="transaction-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search by description, type, or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="Lottery Entry">Lottery Entry</option>
          <option value="Lottery Creation">Lottery Creation</option>
          <option value="Prize Claim">Prize Claim</option>
          <option value="Refund">Refund</option>
          <option value="Cancellation">Cancellation</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* MAIN CONTENT */}
      <div className="transaction-content">
        {/* TABLE */}
        <div className="transaction-table-wrapper">
          {!isConnected ? (
            <div className="transaction-empty">
              <div className="transaction-empty-icon">🔒</div>
              <h3>Wallet Not Connected</h3>
              <p>Connect your MetaMask wallet to view on-chain transactions.</p>
              <button
                type="button"
                className="transaction-action-btn"
                onClick={connectWallet}
              >
                Connect MetaMask
              </button>
            </div>
          ) : !isCorrectNetwork ? (
            <div className="transaction-empty">
              <div className="transaction-empty-icon">⚠️</div>
              <h3>Unsupported Network</h3>
              <p>Please switch your wallet to Ganache Local (1337) or Sepolia (11155111).</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "12px" }}>
                <button
                  type="button"
                  className="transaction-action-btn"
                  onClick={() => switchNetwork(11155111)}
                  style={{ background: "#d4af37", color: "#050505" }}
                >
                  Switch to Sepolia (11155111)
                </button>
                <button
                  type="button"
                  className="transaction-action-btn"
                  onClick={() => switchNetwork(1337)}
                >
                  Switch to Ganache (1337)
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="transaction-loading">
              <div className="transaction-spinner"></div>
              <p>Fetching on-chain transaction records from blockchain logs...</p>
            </div>
          ) : (
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>DESCRIPTION</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>VIEW</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="transaction-date">
                        <strong>{transaction.date}</strong>
                        <span>{transaction.time}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`transaction-type ${transaction.direction}`}
                      >
                        <span className="type-icon">{transaction.icon}</span>
                        {transaction.type}
                      </span>
                    </td>

                    <td>
                      <span className="transaction-description">
                        {transaction.description}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`transaction-amount ${transaction.direction}`}
                      >
                        {transaction.amount}
                      </span>
                    </td>

                    <td>
                      <span className="transaction-status">
                        <i />
                        SUCCESS
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="transaction-view-button"
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {isConnected &&
            isCorrectNetwork &&
            !isLoading &&
            filteredTransactions.length === 0 && (
              <div className="transaction-empty">
                <div className="transaction-empty-icon">▤</div>
                <h3>
                  {transactions.length === 0
                    ? "No On-Chain Transactions Yet"
                    : "No matching transactions found"}
                </h3>
                <p>
                  {transactions.length === 0
                    ? "Create a lottery or enter one to see your on-chain transaction history here."
                    : "Try changing your search or filters."}
                </p>
              </div>
            )}
        </div>

        {/* DETAILS PANEL */}
        {selectedTransaction && (
          <>
            <div
              className="transaction-details-overlay"
              onClick={() => setSelectedTransaction(null)}
              aria-hidden="true"
            />
            <aside className="transaction-details">
            <div className="details-header">
              <h3>TRANSACTION DETAILS</h3>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="details-title">
              <div
                className={`details-main-icon ${selectedTransaction.direction}`}
              >
                {selectedTransaction.icon}
              </div>

              <div>
                <h3>{selectedTransaction.type}</h3>
                <p>{selectedTransaction.description}</p>
              </div>

              <span className="details-success">● SUCCESS</span>
            </div>

            <div className="details-list">
              <div className="details-row">
                <span>Transaction Type</span>
                <strong>{selectedTransaction.type}</strong>
              </div>

              <div className="details-row">
                <span>Amount</span>
                <strong className={selectedTransaction.direction}>
                  {selectedTransaction.amount}
                </strong>
              </div>

              <div className="details-row">
                <span>Status</span>
                <strong className="success-text">● Confirmed on Chain</strong>
              </div>

              <div className="details-row">
                <span>From Address</span>
                <strong style={{ wordBreak: "break-all", fontFamily: "monospace", fontSize: "11px" }}>
                  {selectedTransaction.from}
                </strong>
              </div>

              <div className="details-row">
                <span>To Address</span>
                <strong style={{ wordBreak: "break-all", fontFamily: "monospace", fontSize: "11px" }}>
                  {selectedTransaction.to}
                </strong>
              </div>

              <div className="details-row">
                <span>Transaction Hash</span>
                <strong style={{ wordBreak: "break-all", fontFamily: "monospace", fontSize: "11px", color: "#d4af37" }}>
                  {selectedTransaction.hash}
                </strong>
              </div>

              <div className="details-row">
                <span>Block Number</span>
                <strong>{selectedTransaction.blockStr}</strong>
              </div>

              <div className="details-row">
                <span>Date & Time</span>
                <strong>{selectedTransaction.dateTime}</strong>
              </div>
            </div>

            <button
              type="button"
              className="details-close-button"
              onClick={() => setSelectedTransaction(null)}
            >
              Close
            </button>
          </aside>
        </>
      )}
      </div>
    </div>
  );
}

export default Transactions;