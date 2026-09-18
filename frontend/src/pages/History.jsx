import { useState, useEffect, useMemo, useCallback } from "react";
import "./History.css";
import { useWeb3 } from "../context/Web3Context";
import { fetchUserHistory } from "../services/lotteryService";

function History() {
  const {
    contract,
    web3,
    account,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    switchNetwork,
  } = useWeb3();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedLottery, setSelectedLottery] = useState(null);

  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  /* =========================================
     FETCH ON-CHAIN HISTORY
  ========================================= */
  const fetchHistory = useCallback(async () => {
    if (!isConnected || !account) {
      setHistoryList([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    if (!isCorrectNetwork) {
      setHistoryList([]);
      setIsLoading(false);
      setLoadError("Unsupported network. Please switch to Ganache Local (1337) or Sepolia.");
      return;
    }

    if (!contract) {
      setHistoryList([]);
      setIsLoading(false);
      setLoadError("Lottery smart contract is not available on current network.");
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchUserHistory(contract, web3, account);
      setHistoryList(data);
    } catch (err) {
      console.error("Error fetching user history:", err);
      setLoadError(err.message || "Failed to load on-chain lottery history.");
    } finally {
      setIsLoading(false);
    }
  }, [contract, web3, account, isConnected, isCorrectNetwork]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        fetchHistory();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchHistory]);

  /* =========================================
     COMPUTE SUMMARY STATS
  ========================================= */
  const stats = useMemo(() => {
    let entries = 0;
    let winnings = 0;
    let losses = 0;
    let created = 0;

    historyList.forEach((item) => {
      if (item.type === "participated") entries++;
      if (item.result === "WON") winnings++;
      if (item.result === "LOST") losses++;
      if (item.type === "created") created++;
    });

    return { entries, winnings, losses, created };
  }, [historyList]);

  /* =========================================
     FILTER & SEARCH RECORDS
  ========================================= */
  const filteredHistory = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return historyList.filter((item) => {
      const matchesSearch =
        !searchText ||
        (item.lottery && item.lottery.toLowerCase().includes(searchText)) ||
        (item.category && item.category.toLowerCase().includes(searchText)) ||
        (item.result && item.result.toLowerCase().includes(searchText)) ||
        (item.prize && item.prize.toLowerCase().includes(searchText)) ||
        (item.status && item.status.toLowerCase().includes(searchText)) ||
        (item.creator && item.creator.toLowerCase().includes(searchText)) ||
        (item.winner && item.winner.toLowerCase().includes(searchText)) ||
        String(item.id).includes(searchText);

      let matchesFilter = true;

      if (filter === "winnings") {
        matchesFilter = item.result === "WON";
      } else if (filter === "losses") {
        matchesFilter = item.result === "LOST";
      } else if (filter === "my-lotteries") {
        matchesFilter = item.type === "created";
      } else if (filter === "participated") {
        matchesFilter = item.type === "participated";
      } else if (filter === "active") {
        matchesFilter = item.status === "ACTIVE";
      } else if (filter === "closed") {
        matchesFilter = item.status === "CLOSED";
      }

      return matchesSearch && matchesFilter;
    });
  }, [historyList, search, filter]);

  return (
    <div className="history-page">
      {/* PAGE HEADER */}
      <div className="history-heading">
        <div>
          <h2>
            Lottery <span>History</span>
          </h2>
          <p>Complete on-chain record of your lottery activity.</p>
        </div>

        <div className="history-heading-actions">
          <button
            type="button"
            className="history-refresh-btn"
            onClick={fetchHistory}
            disabled={isLoading || !isConnected}
            title="Refresh history from blockchain"
          >
            ↻ Refresh
          </button>
          <div className="history-count">
            {filteredHistory.length} {filteredHistory.length === 1 ? "Record" : "Records"}
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="history-summary">
        <div className="history-stat">
          <span>My Entries</span>
          <strong>{stats.entries}</strong>
          <small>Lotteries participated</small>
        </div>

        <div className="history-stat">
          <span>Winnings</span>
          <strong>{stats.winnings}</strong>
          <small>Lotteries won</small>
        </div>

        <div className="history-stat">
          <span>Losses</span>
          <strong>{stats.losses}</strong>
          <small>Lotteries lost</small>
        </div>

        <div className="history-stat">
          <span>My Lotteries</span>
          <strong>{stats.created}</strong>
          <small>Created by you</small>
        </div>
      </div>

      {/* ERROR BANNER */}
      {loadError && isConnected && isCorrectNetwork && (
        <div className="history-error-banner">
          <span>⚠️ {loadError}</span>
          <button type="button" className="history-retry-btn" onClick={fetchHistory}>
            Retry
          </button>
        </div>
      )}

      {/* CONTROLS */}
      <div className="history-controls">
        <div className="history-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search lotteries, categories, status, or addresses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Activity</option>
          <option value="winnings">Winnings</option>
          <option value="losses">Losses</option>
          <option value="my-lotteries">My Lotteries (Created)</option>
          <option value="participated">Participated</option>
          <option value="active">Active Lotteries</option>
          <option value="closed">Closed Lotteries</option>
        </select>
      </div>

      {/* HISTORY TABLE CONTAINER */}
      <div className="history-table-wrapper">
        {/* DISCONNECTED WALLET STATE */}
        {!isConnected ? (
          <div className="history-empty">
            <div className="history-empty-icon">🔒</div>
            <h3>Wallet Not Connected</h3>
            <p>Connect your MetaMask wallet to view your on-chain lottery activity.</p>
            <button
              type="button"
              className="history-action-btn"
              onClick={connectWallet}
            >
              Connect MetaMask
            </button>
          </div>
        ) : !isCorrectNetwork ? (
          /* WRONG NETWORK STATE */
          <div className="history-empty">
            <div className="history-empty-icon">⚠️</div>
            <h3>Unsupported Network</h3>
            <p>Please switch your wallet to Ganache Local (1337) or Sepolia (11155111).</p>
            <button
              type="button"
              className="history-action-btn"
              onClick={() => switchNetwork(1337)}
            >
              Switch to Ganache (1337)
            </button>
          </div>
        ) : isLoading ? (
          /* LOADING STATE */
          <div className="history-loading">
            <div className="history-spinner"></div>
            <p>Fetching on-chain lottery records...</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lottery</th>
                <th>Date</th>
                <th>Result</th>
                <th>Prize</th>
                <th>Status</th>
                <th>Transaction</th>
                <th>View</th>
              </tr>
            </thead>

            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td className="history-number">
                    {String(item.id).padStart(2, "0")}
                  </td>

                  <td>
                    <div className="history-lottery">
                      <strong>{item.lottery}</strong>
                      <span>{item.category}</span>
                    </div>
                  </td>

                  <td>
                    <span className="history-date">
                      {item.date || "—"}
                    </span>
                  </td>

                  <td>
                    {item.result !== "—" ? (
                      <span
                        className={`result-badge ${item.result.toLowerCase()}`}
                      >
                        {item.result}
                      </span>
                    ) : (
                      <span className="result-dash">—</span>
                    )}
                  </td>

                  <td>
                    <span className="history-prize">
                      {item.prize}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <span className="tx-hash" title={item.rawTxHash || item.txHash}>
                      {item.txHash}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="history-view-button"
                      onClick={() => setSelectedLottery(item)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* EMPTY SEARCH / EMPTY DATA STATE */}
        {isConnected && isCorrectNetwork && !isLoading && filteredHistory.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">⌕</div>
            <h3>
              {historyList.length === 0
                ? "No Lottery Activity Yet"
                : "No matching records found"}
            </h3>
            <p>
              {historyList.length === 0
                ? "You haven't created or participated in any lotteries with this wallet yet."
                : "Try adjusting your search query or filter."}
            </p>
          </div>
        )}
      </div>

      {/* =========================================
          READ-ONLY LOTTERY DETAILS MODAL
      ========================================= */}
      {selectedLottery && (
        <div
          className="history-modal-overlay"
          onClick={() => setSelectedLottery(null)}
        >
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              className="history-modal-close"
              onClick={() => setSelectedLottery(null)}
              aria-label="Close lottery details"
            >
              ×
            </button>

            {/* MODAL HEADER */}
            <div className="history-modal-header">
              <div>
                <div className="history-modal-badge-row">
                  <span className="history-modal-category">
                    {selectedLottery.category}
                  </span>
                  <span className="history-modal-id">
                    #{String(selectedLottery.id).padStart(3, "0")}
                  </span>
                </div>

                <h2>{selectedLottery.lottery}</h2>
                <p>{selectedLottery.description}</p>
              </div>
            </div>

            {/* LOTTERY INFORMATION */}
            <div className="history-modal-info">
              <div className="history-modal-info-item">
                <span>Lottery ID</span>
                <strong>#{String(selectedLottery.id).padStart(3, "0")}</strong>
              </div>

              <div className="history-modal-info-item">
                <span>Prize Type</span>
                <strong>{selectedLottery.prizeType || "Physical Prize"}</strong>
              </div>

              <div className="history-modal-info-item">
                <span>Prize Value</span>
                <strong>
                  {selectedLottery.prizeValueDisplay || selectedLottery.prize || "—"}
                </strong>
              </div>

              <div className="history-modal-info-item">
                <span>Entry Fee</span>
                <strong>{selectedLottery.entryFee}</strong>
              </div>

              <div className="history-modal-info-item">
                <span>Participants</span>
                <strong>
                  {selectedLottery.participants} / {selectedLottery.maxParticipants}
                </strong>
              </div>

              <div className="history-modal-info-item">
                <span>Lottery Status</span>
                <strong
                  className={
                    selectedLottery.status === "ACTIVE"
                      ? "modal-active"
                      : selectedLottery.status === "CANCELLED"
                      ? "modal-cancelled"
                      : "modal-closed"
                  }
                >
                  {selectedLottery.status}
                </strong>
              </div>

              <div className="history-modal-info-item">
                <span>Your Role</span>
                <strong style={{ textTransform: "capitalize" }}>
                  {selectedLottery.type === "created"
                    ? "Organizer (Creator)"
                    : "Participant"}
                </strong>
              </div>

              <div className="history-modal-info-item">
                <span>Your Result</span>
                <strong
                  className={
                    selectedLottery.result === "WON"
                      ? "modal-won"
                      : selectedLottery.result === "LOST"
                      ? "modal-lost"
                      : selectedLottery.result === "PENDING"
                      ? "modal-pending"
                      : "modal-neutral"
                  }
                >
                  {selectedLottery.result}
                </strong>
              </div>

              <div className="history-modal-info-item">
                <span>Date</span>
                <strong>{selectedLottery.date || "—"}</strong>
              </div>

              {selectedLottery.result === "WON" && (
                <div className="history-modal-info-item">
                  <span>Claim Status</span>
                  <strong
                    className={
                      selectedLottery.claimStatus === "CLAIMED"
                        ? "modal-won"
                        : "modal-pending"
                    }
                  >
                    {selectedLottery.claimStatus}
                  </strong>
                </div>
              )}

              <div
                className="history-modal-info-item history-modal-full-width"
              >
                <span>Creator Address</span>
                <strong className="history-modal-address">
                  {selectedLottery.creator}
                </strong>
              </div>

              {selectedLottery.winnerSelected && selectedLottery.winner && (
                <div
                  className="history-modal-info-item history-modal-full-width"
                >
                  <span>Winner Address</span>
                  <strong className="history-modal-address modal-winner-addr">
                    {selectedLottery.winner}
                  </strong>
                </div>
              )}

              {selectedLottery.rawTxHash && (
                <div
                  className="history-modal-info-item history-modal-full-width"
                >
                  <span>Transaction Hash</span>
                  <strong className="history-modal-address" style={{ color: "#d4af37" }}>
                    {selectedLottery.rawTxHash}
                  </strong>
                </div>
              )}
            </div>

            {/* READ-ONLY FOOTER NOTICE */}
            <div className="history-modal-footer-notice">
              <span>ℹ️ Historical on-chain record (Read-Only)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;