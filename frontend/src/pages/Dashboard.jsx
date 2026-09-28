import { useState, useEffect, useCallback } from "react";
import "./Dashboard.css";
import { useWeb3 } from "../context/Web3Context";
import { fetchAllLotteries } from "../services/lotteryService";
import { truncateAddress } from "../services/web3Service";

function Dashboard() {
  const { contract, web3, account, isConnected, isCorrectNetwork, connectWallet, switchNetwork, refreshBalance } = useWeb3();

  const [lotteries, setLotteries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Selected lottery for details popup
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [enteringId, setEnteringId] = useState(null);
  const [enterTxStatus, setEnterTxStatus] = useState(null); // null | "waiting-metamask" | "mining" | "success" | "error"
  const [enterTxHash, setEnterTxHash] = useState(null);
  const [enterError, setEnterError] = useState(null);

  // Winner selection state
  const [winnerTxStatus, setWinnerTxStatus] = useState(null); // null | "waiting-metamask" | "mining" | "success" | "error"
  const [winnerTxHash, setWinnerTxHash] = useState(null);
  const [winnerError, setWinnerError] = useState(null);
  const [isSelectingWinner, setIsSelectingWinner] = useState(false);
  const [winnerMode, setWinnerMode] = useState("random"); // "random" | "manual"
  const [selectedManualAddress, setSelectedManualAddress] = useState("");

  const categories = [
    "All",
    "Technology",
    "Gaming",
    "Electronics",
    "Fashion",
    "Crypto",
    "Cars",
    "Real Estate",
    "Home",
    "Travel",
    "Education",
    "Lifestyle",
    "Food",
  ];

  /* ================================
     FETCH ON-CHAIN LOTTERIES
  ================================= */
  const loadLotteries = useCallback(async () => {
    if (!contract) {
      if (!isCorrectNetwork && isConnected) {
        setLoadError("Smart contract not found on this network. Please switch to Ganache Local (1337) or Sepolia.");
      } else if (!isConnected) {
        setLoadError(null);
        setLotteries([]);
      } else {
        setLoadError("Lottery contract not deployed on current network.");
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await fetchAllLotteries(contract, web3);
      setLotteries(data);
    } catch (err) {
      console.error("Error loading on-chain lotteries:", err);
      setLoadError("Failed to fetch lotteries from the blockchain. Please verify your node is running and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [contract, web3, isConnected, isCorrectNetwork]);

  useEffect(() => {
    let isCancelled = false;

    // Use async queue to avoid synchronous render cascade
    Promise.resolve().then(async () => {
      if (isCancelled) return;
      await loadLotteries();
    });

    return () => {
      isCancelled = true;
    };
  }, [loadLotteries]);
  /* ================================
     ENTER LOTTERY TRANSACTION
  ================================= */
  const handleEnterLottery = async (lottery) => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (!isCorrectNetwork) {
      switchNetwork(11155111);
      return;
    }
    if (!contract || !lottery) return;

    setEnteringId(lottery.id);
    setEnterTxStatus("waiting-metamask");
    setEnterError(null);
    setEnterTxHash(null);

    try {
      const txPromise = contract.methods.enterLottery(lottery.id).send({
        from: account,
        value: lottery.entryFeeWei,
      });

      txPromise.on("transactionHash", (hash) => {
        setEnterTxHash(hash);
        setEnterTxStatus("mining");
      });

      const receipt = await txPromise;
      setEnterTxHash(receipt.transactionHash);
      setEnterTxStatus("success");

      // Re-fetch entire blockchain state
      await loadLotteries();
      if (refreshBalance) {
        await refreshBalance();
      }

      // Update selectedLottery modal state directly from contract
      const updated = await contract.methods.getLottery(lottery.id).call();
      const updatedParts = await contract.methods.getParticipants(lottery.id).call();

      const partsCount = Number(updated.participantCount ?? updated[13]);
      const isOpenBool = Boolean(updated.isOpen ?? updated[14]);

      setSelectedLottery((prev) => {
        if (!prev || prev.id !== lottery.id) return prev;
        return {
          ...prev,
          participants: partsCount,
          isOpen: isOpenBool,
          participantAddresses: Array.isArray(updatedParts)
            ? updatedParts.map((addr) => addr.toLowerCase())
            : [],
          timeLeft:
            !isOpenBool || partsCount >= prev.maxParticipants
              ? "Closed (Full)"
              : prev.timeLeft,
        };
      });
    } catch (err) {
      console.error("Enter lottery error:", err);
      setEnterTxStatus("error");
      if (err.code === 4001) {
        setEnterError("Transaction was rejected in MetaMask.");
      } else if (err.message && err.message.includes("insufficient funds")) {
        setEnterError("Insufficient funds in your wallet to cover entry fee and gas.");
      } else {
        setEnterError(err.message || "Failed to enter lottery.");
      }
    } finally {
      setEnteringId(null);
    }
  };

  /* ================================
     MODAL CONTROLS
  ================================= */
  const handleOpenModal = (lottery) => {
    setSelectedLottery(lottery);
    setEnterTxStatus(null);
    setEnterTxHash(null);
    setEnterError(null);
    setEnteringId(null);
    setWinnerTxStatus(null);
    setWinnerTxHash(null);
    setWinnerError(null);
    setIsSelectingWinner(false);
    setWinnerMode("random");
    setSelectedManualAddress("");
  };

  const handleCloseModal = () => {
    setSelectedLottery(null);
    setEnterTxStatus(null);
    setEnterTxHash(null);
    setEnterError(null);
    setEnteringId(null);
    setWinnerTxStatus(null);
    setWinnerTxHash(null);
    setWinnerError(null);
    setIsSelectingWinner(false);
    setSelectedManualAddress("");
  };

  /* ================================
     WINNER SELECTION (CREATOR ONLY)
  ================================= */
  const handlePickWinnerRandom = async (lotteryId) => {
    if (!contract || !account || isSelectingWinner) return;

    setIsSelectingWinner(true);
    setWinnerTxStatus("waiting-metamask");
    setWinnerError(null);
    setWinnerTxHash(null);

    try {
      const txPromise = contract.methods.pickWinnerRandom(lotteryId).send({
        from: account,
      });

      txPromise.on("transactionHash", (hash) => {
        setWinnerTxHash(hash);
        setWinnerTxStatus("mining");
      });

      const receipt = await txPromise;
      setWinnerTxHash(receipt.transactionHash);
      setWinnerTxStatus("success");

      // Re-fetch entire blockchain state
      await loadLotteries();
      if (refreshBalance) {
        await refreshBalance();
      }

      // Re-fetch updated lottery data from smart contract
      const updated = await contract.methods.getLottery(lotteryId).call();
      const updatedWinnerSelected = Boolean(updated.winnerSelected ?? updated[15]);
      const updatedWinner = (updated.winner ?? updated[16]).toString();
      const updatedIsOpen = Boolean(updated.isOpen ?? updated[14]);
      const updatedPrizeClaimed = Boolean(updated.prizeClaimed ?? updated[17]);

      setSelectedLottery((prev) => {
        if (!prev || prev.id !== lotteryId) return prev;
        return {
          ...prev,
          winnerSelected: updatedWinnerSelected,
          winner: updatedWinner,
          isOpen: updatedIsOpen,
          prizeClaimed: updatedPrizeClaimed,
          timeLeft: updatedPrizeClaimed
            ? "Prize Claimed"
            : updatedWinnerSelected
            ? "Winner Drawn"
            : "Closed (Full)",
        };
      });
    } catch (err) {
      console.error("Error picking random winner:", err);
      setWinnerTxStatus("error");
      if (err.code === 4001) {
        setWinnerError("Transaction was rejected in MetaMask.");
      } else {
        setWinnerError(err.message || "Failed to draw random winner.");
      }
    } finally {
      setIsSelectingWinner(false);
    }
  };

  const handlePickWinnerManually = async (lotteryId, winnerAddress) => {
    if (!contract || !account || isSelectingWinner || !winnerAddress) return;

    // Verify selected address is in the participants list
    const participants = selectedLottery?.participantAddresses || [];
    if (!participants.includes(winnerAddress.toLowerCase())) {
      setWinnerError("Selected address is not an on-chain participant in this lottery.");
      setWinnerTxStatus("error");
      return;
    }

    setIsSelectingWinner(true);
    setWinnerTxStatus("waiting-metamask");
    setWinnerError(null);
    setWinnerTxHash(null);

    try {
      const txPromise = contract.methods.pickWinnerManually(lotteryId, winnerAddress).send({
        from: account,
      });

      txPromise.on("transactionHash", (hash) => {
        setWinnerTxHash(hash);
        setWinnerTxStatus("mining");
      });

      const receipt = await txPromise;
      setWinnerTxHash(receipt.transactionHash);
      setWinnerTxStatus("success");

      // Re-fetch entire blockchain state
      await loadLotteries();
      if (refreshBalance) {
        await refreshBalance();
      }

      // Re-fetch updated lottery data from smart contract
      const updated = await contract.methods.getLottery(lotteryId).call();
      const updatedWinnerSelected = Boolean(updated.winnerSelected ?? updated[15]);
      const updatedWinner = (updated.winner ?? updated[16]).toString();
      const updatedIsOpen = Boolean(updated.isOpen ?? updated[14]);
      const updatedPrizeClaimed = Boolean(updated.prizeClaimed ?? updated[17]);

      setSelectedLottery((prev) => {
        if (!prev || prev.id !== lotteryId) return prev;
        return {
          ...prev,
          winnerSelected: updatedWinnerSelected,
          winner: updatedWinner,
          isOpen: updatedIsOpen,
          prizeClaimed: updatedPrizeClaimed,
          timeLeft: updatedPrizeClaimed
            ? "Prize Claimed"
            : updatedWinnerSelected
            ? "Winner Drawn"
            : "Closed (Full)",
        };
      });
    } catch (err) {
      console.error("Error picking manual winner:", err);
      setWinnerTxStatus("error");
      if (err.code === 4001) {
        setWinnerError("Transaction was rejected in MetaMask.");
      } else {
        setWinnerError(err.message || "Failed to select manual winner.");
      }
    } finally {
      setIsSelectingWinner(false);
    }
  };

  /* ================================
     FILTER + SORT
  ================================= */
  const filteredLotteries = lotteries
    .filter((lottery) => {
      const searchText = search.toLowerCase().trim();

      const searchableText = `
        ${lottery.prizeName || ""}
        ${lottery.description || ""}
        ${lottery.category || ""}
        ${lottery.creator || ""}
        #${lottery.id}
      `.toLowerCase();

      const matchesSearch =
        searchText === "" || searchableText.includes(searchText);

      const matchesCategory =
        category === "All" || lottery.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "entry-low":
          return a.entryFeeEth - b.entryFeeEth;

        case "participants":
          return b.participants - a.participants;

        case "newest":
          return b.id - a.id;

        default:
          return b.id - a.id;
      }
    });

  return (
    <div className="dashboard">
      {/* ================================
          WELCOME
      ================================= */}
      <section className="dashboard-welcome">
        <h2>
          Welcome <span>Back!</span>
        </h2>
        <p>
          Discover, participate, and win exciting prizes on the blockchain.
        </p>
      </section>

      {/* ================================
          ERROR BANNER
      ================================= */}
      {loadError && (
        <div className="dashboard-error-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>⚠️</span>
            <span>{loadError}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {!isCorrectNetwork && isConnected && (
              <button
                type="button"
                onClick={() => switchNetwork(11155111)}
                style={{ background: "#e1b52a", color: "#050505", fontWeight: "600" }}
              >
                Switch to Sepolia
              </button>
            )}
            <button type="button" onClick={loadLotteries}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ================================
          NOT CONNECTED NOTICE
      ================================= */}
      {!isConnected && (
        <div className="dashboard-error-banner" style={{ background: "rgba(212, 169, 38, 0.08)", borderColor: "rgba(212, 169, 38, 0.3)", color: "#e6b91e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>🦊</span>
            <span>Connect your MetaMask wallet to view on-chain lotteries and participate.</span>
          </div>
          <button
            type="button"
            onClick={connectWallet}
            style={{ background: "#e1b52a", color: "#050505", fontWeight: "700" }}
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* ================================
          SEARCH + CATEGORY
      ================================= */}
      <div className="dashboard-search-row">
        {/* Search */}
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search lotteries by prize, category, creator (#ID)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="select-wrapper">
          <span className="select-icon">☷</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Categories" : item}
              </option>
            ))}
          </select>
          <span className="select-arrow">⌄</span>
        </div>
      </div>

      {/* ================================
          ACTIVE LOTTERIES
      ================================= */}
      <section className="lottery-section">
        <div className="lottery-heading">
          <div>
            <h2>
              Active <span>Lotteries</span>
            </h2>
            <p>
              Join transparent on-chain lotteries powered by smart contracts.
            </p>
          </div>

          {/* Refresh + Sort */}
          <div className="lottery-heading-controls">
            <button
              type="button"
              className="refresh-btn"
              onClick={loadLotteries}
              title="Refresh lotteries from blockchain"
            >
              <span>↻</span>
              <span>Refresh</span>
            </button>

            <div className="sort-wrapper">
              <span className="sort-label">Sort by</span>
              <div className="select-wrapper sort-select">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="entry-low">Lowest Entry Fee</option>
                  <option value="participants">Most Participants</option>
                </select>
                <span className="select-arrow">⌄</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================
            LOADING STATE
        ================================= */}
        {isLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-spinner"></div>
            <p style={{ color: "#c8c8c8", fontSize: "14px" }}>
              Reading lotteries from the smart contract...
            </p>
          </div>
        )}

        {/* ================================
            LOTTERY CARDS
        ================================= */}
        {!isLoading && (
          <div className="lottery-grid">
            {filteredLotteries.map((lottery) => {
              const isUserCreator =
                account &&
                lottery.creator &&
                lottery.creator.toLowerCase() === account.toLowerCase();

              const isUserEntered =
                account &&
                lottery.participantAddresses &&
                lottery.participantAddresses.includes(account.toLowerCase());

              return (
                <article className="lottery-card" key={lottery.id}>
                  {/* IMAGE */}
                  <div className="lottery-image-wrapper">
                    <img
                      src={lottery.image}
                      alt={lottery.prizeName}
                      className="lottery-image"
                    />
                    <span className="category-badge">{lottery.category}</span>
                  </div>

                  {/* CARD BODY */}
                  <div className="lottery-card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <h3>{lottery.prizeName}</h3>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {lottery.winnerSelected && (
                          <span className="creator-tag" style={{ color: "#e6b91e", borderColor: "rgba(230, 185, 30, 0.4)", background: "rgba(230, 185, 30, 0.15)" }}>
                            🏆 Winner Drawn
                          </span>
                        )}
                        {isUserCreator && (
                          <span className="creator-tag">You Created</span>
                        )}
                        {isUserEntered && !isUserCreator && (
                          <span className="creator-tag" style={{ color: "#22c55e", borderColor: "rgba(34, 197, 94, 0.4)", background: "rgba(34, 197, 94, 0.12)" }}>
                            Entered
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="lottery-description">{lottery.description}</p>

                    {/* INFORMATION */}
                    <div className="lottery-info">
                      <div className="info-item">
                        <span>◆</span>
                        <div>
                          <strong>{lottery.entryFee}</strong>
                          <small>Entry Fee</small>
                        </div>
                      </div>

                      <div className="info-item">
                        <span>👥</span>
                        <div>
                          <strong>
                            {lottery.participants} / {lottery.maxParticipants}
                          </strong>
                          <small>Participants</small>
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS */}
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            (lottery.participants / lottery.maxParticipants) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    {/* WINNER PREVIEW ON CARD */}
                    {lottery.winnerSelected && lottery.winner && (
                      <div className="card-winner-preview">
                        <span>Winner:</span> <strong>{truncateAddress(lottery.winner)}</strong>
                      </div>
                    )}

                    {/* FOOTER */}
                    <div className="lottery-footer">
                      <span className="time-left">
                        ◷ {lottery.timeLeft}
                      </span>

                      <button
                        type="button"
                        className="view-btn"
                        onClick={() => handleOpenModal(lottery)}
                      >
                        View Details
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ================================
            EMPTY STATE
        ================================= */}
        {!isLoading && filteredLotteries.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">◇</div>
            <h3>No lotteries found</h3>
            <p>
              {lotteries.length === 0
                ? "There are currently no active lotteries on the blockchain. Create the first one!"
                : "No lotteries match your current search or category filter."}
            </p>
          </div>
        )}
      </section>

      {/* =================================================
          LOTTERY DETAILS POPUP
      ================================================= */}
      {selectedLottery && (() => {
        const isUserCreator =
          account &&
          selectedLottery.creator &&
          selectedLottery.creator.toLowerCase() === account.toLowerCase();

        const isUserEntered =
          account &&
          selectedLottery.participantAddresses &&
          selectedLottery.participantAddresses.includes(account.toLowerCase());

        const isClosed =
          !selectedLottery.isOpen ||
          selectedLottery.participants >= selectedLottery.maxParticipants;

        return (
          <div
            className="lottery-modal-overlay"
            onClick={handleCloseModal}
          >
            <div
              className="lottery-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON */}
              <button
                type="button"
                className="lottery-modal-close"
                onClick={handleCloseModal}
                aria-label="Close lottery details"
              >
                ×
              </button>

              {/* MODAL IMAGE */}
              <div className="lottery-modal-image-wrapper">
                <img
                  src={selectedLottery.image}
                  alt={selectedLottery.prizeName}
                  className="lottery-modal-image"
                />
                <span className="modal-category-badge">
                  {selectedLottery.category}
                </span>
              </div>

              {/* MODAL CONTENT */}
              <div className="lottery-modal-content">
                <h2>{selectedLottery.prizeName}</h2>
                <p className="modal-description">
                  {selectedLottery.description}
                </p>

                {/* Details Grid */}
                <div className="modal-details-grid">
                  <div className="modal-detail">
                    <span>Entry Fee</span>
                    <strong>{selectedLottery.entryFee}</strong>
                  </div>

                  <div className="modal-detail">
                    <span>Participants</span>
                    <strong>
                      {selectedLottery.participants} /{" "}
                      {selectedLottery.maxParticipants}
                    </strong>
                  </div>

                  <div className="modal-detail">
                    <span>Status</span>
                    <strong>{selectedLottery.timeLeft}</strong>
                  </div>

                  <div className="modal-detail">
                    <span>Lottery ID</span>
                    <strong>#{selectedLottery.id}</strong>
                  </div>

                  {selectedLottery.prizeType && (
                    <div className="modal-detail">
                      <span>Prize Type</span>
                      <strong>{selectedLottery.prizeType}</strong>
                    </div>
                  )}

                  {selectedLottery.prizeValue && (
                    <div className="modal-detail">
                      <span>Prize Value</span>
                      <strong>
                        {selectedLottery.prizeValue}{" "}
                        {selectedLottery.prizeCurrency || ""}
                      </strong>
                    </div>
                  )}

                  {selectedLottery.creator && (
                    <div className="modal-detail modal-detail-full">
                      <span>Creator (Organizer)</span>
                      <strong>
                        {truncateAddress(selectedLottery.creator)}
                        {isUserCreator ? " (You)" : ""}
                        {selectedLottery.organizerContact
                          ? ` • Contact: ${selectedLottery.organizerContact}`
                          : ""}
                      </strong>
                    </div>
                  )}
                </div>

                {/* =================================================
                    WINNER ANNOUNCEMENT BANNER (When Winner Selected)
                ================================================= */}
                {selectedLottery.winnerSelected && selectedLottery.winner && (
                  <div className="winner-announcement-card">
                    <div className="winner-announcement-top">
                      <div className="winner-trophy">🏆</div>
                      <div>
                        <span className="winner-badge-label">Official Winner Drawn</span>
                        <h3 className="winner-address-heading">
                          {truncateAddress(selectedLottery.winner)}
                        </h3>
                        <code className="winner-full-address">{selectedLottery.winner}</code>
                      </div>
                    </div>

                    {account &&
                      selectedLottery.winner.toLowerCase() === account.toLowerCase() && (
                        <div className="winner-congrats-pill">
                          🎉 You won this lottery! You can claim your prize under My Winnings.
                        </div>
                      )}

                    <div className="winner-claim-status-row">
                      <span>Prize Claim Status:</span>
                      {selectedLottery.prizeClaimed ? (
                        <span className="claim-status-badge claimed">✓ Prize Claimed by Winner</span>
                      ) : (
                        <span className="claim-status-badge unclaimed">⏳ Prize Unclaimed</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress */}
                <div className="modal-progress-section">
                  <div className="modal-progress-header">
                    <span>Participation Progress</span>
                    <strong>
                      {selectedLottery.participants} /{" "}
                      {selectedLottery.maxParticipants}
                    </strong>
                  </div>

                  <div className="progress-bar modal-progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          (selectedLottery.participants /
                            selectedLottery.maxParticipants) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* =================================================
                    WINNER SELECTION PANEL (Creator Only, Closed, No Winner Yet)
                ================================================= */}
                {isUserCreator && !selectedLottery.winnerSelected && (
                  <>
                    {selectedLottery.isOpen ? (
                      <div className="creator-notice-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>ℹ️</span>
                          <strong>Lottery in Progress (Creator View)</strong>
                        </div>
                        <p style={{ margin: "6px 0 0", color: "#a0a0a0", lineHeight: "1.5" }}>
                          You created this lottery. Winner selection will be unlocked once all {selectedLottery.maxParticipants} participant slots are filled and the lottery automatically closes.
                        </p>
                      </div>
                    ) : selectedLottery.cancelled ? (
                      <div className="creator-notice-box">
                        <span>⚠️ This lottery was cancelled. No winner can be drawn.</span>
                      </div>
                    ) : selectedLottery.participants === 0 ? (
                      <div className="creator-notice-box">
                        <span>⚠️ This lottery closed with 0 participants. A winner cannot be drawn.</span>
                      </div>
                    ) : (
                      <div className="winner-selection-box">
                        <div className="winner-selection-header">
                          <h4>👑 Draw Winner (Organizer Control)</h4>
                          <p>This lottery is full and closed. As creator, choose a method to select the winner:</p>
                        </div>

                        <div className="winner-mode-tabs">
                          <button
                            type="button"
                            className={`winner-tab-btn ${winnerMode === "random" ? "active" : ""}`}
                            onClick={() => setWinnerMode("random")}
                            disabled={isSelectingWinner}
                          >
                            🎲 Random Selection
                          </button>
                          <button
                            type="button"
                            className={`winner-tab-btn ${winnerMode === "manual" ? "active" : ""}`}
                            onClick={() => setWinnerMode("manual")}
                            disabled={isSelectingWinner}
                          >
                            🎯 Manual Selection
                          </button>
                        </div>

                        {winnerMode === "random" ? (
                          <div>
                            <p className="academic-disclaimer">
                              ⚠️ <strong>Simulation Note:</strong> Calls <code>pickWinnerRandom()</code> on the smart contract using block pseudo-randomness. Designed for academic/demo simulation; not cryptographically secure for real-money gambling.
                            </p>
                            <button
                              type="button"
                              className="pick-winner-btn"
                              onClick={() => handlePickWinnerRandom(selectedLottery.id)}
                              disabled={isSelectingWinner}
                            >
                              {isSelectingWinner ? (
                                <>
                                  <span className="tx-spinner"></span>
                                  <span>{winnerTxStatus === "mining" ? "Drawing on Blockchain..." : "Confirm in MetaMask..."}</span>
                                </>
                              ) : (
                                <>
                                  <span>🎲 Draw Random Winner ({selectedLottery.participants} Participants)</span>
                                  <span>→</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <label className="manual-select-label" htmlFor="manual-participant-select">
                              Select an on-chain participant:
                            </label>
                            <select
                              id="manual-participant-select"
                              className="manual-participant-select"
                              value={selectedManualAddress}
                              onChange={(e) => setSelectedManualAddress(e.target.value)}
                              disabled={isSelectingWinner}
                            >
                              <option value="">-- Choose participant address --</option>
                              {(selectedLottery.rawParticipants && selectedLottery.rawParticipants.length > 0
                                ? selectedLottery.rawParticipants
                                : selectedLottery.participantAddresses || []
                              ).map((addr, idx) => (
                                <option key={addr + idx} value={addr}>
                                  #{idx + 1}: {truncateAddress(addr)} ({addr})
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="pick-winner-btn"
                              onClick={() => handlePickWinnerManually(selectedLottery.id, selectedManualAddress)}
                              disabled={isSelectingWinner || !selectedManualAddress}
                            >
                              {isSelectingWinner ? (
                                <>
                                  <span className="tx-spinner"></span>
                                  <span>{winnerTxStatus === "mining" ? "Assigning on Blockchain..." : "Confirm in MetaMask..."}</span>
                                </>
                              ) : (
                                <>
                                  <span>🎯 Confirm Selected Participant as Winner</span>
                                  <span>→</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Winner Tx Feedback */}
                        {winnerTxStatus && (
                          <div className={`tx-status-card ${winnerTxStatus}`} style={{ marginTop: "14px" }}>
                            {winnerTxStatus === "waiting-metamask" && (
                              <div>
                                <span className="tx-spinner"></span>
                                <strong>Confirm in MetaMask...</strong>
                                <p style={{ margin: "4px 0 0", color: "#c8c8c8" }}>
                                  Please confirm the winner selection transaction in your wallet.
                                </p>
                              </div>
                            )}
                            {winnerTxStatus === "mining" && (
                              <div>
                                <span className="tx-spinner"></span>
                                <strong>Transaction is being mined on the blockchain...</strong>
                                <p style={{ margin: "4px 0 0" }}>Tx Hash: <code>{winnerTxHash}</code></p>
                              </div>
                            )}
                            {winnerTxStatus === "success" && (
                              <div>
                                <strong style={{ color: "#22c55e" }}>✓ Winner Successfully Selected!</strong>
                                <p style={{ margin: "4px 0 0" }}>The winner has been permanently recorded on-chain.</p>
                                <p style={{ margin: "4px 0 0" }}>Tx Hash: <code>{winnerTxHash}</code></p>
                              </div>
                            )}
                            {winnerTxStatus === "error" && winnerError && (
                              <div>
                                <strong>⚠️ Winner Selection Failed</strong>
                                <p style={{ margin: "4px 0 0" }}>{winnerError}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Transaction feedback in modal for Enter Lottery */}
                {enterTxStatus && (
                  <div className={`tx-status-card ${enterTxStatus}`} style={{ marginTop: "16px" }}>
                    {enterTxStatus === "waiting-metamask" && (
                      <div>
                        <span className="tx-spinner"></span>
                        <strong>Confirm in MetaMask...</strong>
                        <p style={{ margin: "4px 0 0", color: "#c8c8c8" }}>
                          Please confirm the entry fee payment in your wallet.
                        </p>
                      </div>
                    )}
                    {enterTxStatus === "mining" && (
                      <div>
                        <span className="tx-spinner"></span>
                        <strong>Transaction is being mined on the blockchain...</strong>
                        <p style={{ margin: "4px 0 0" }}>Tx Hash: <code>{enterTxHash}</code></p>
                      </div>
                    )}
                    {enterTxStatus === "success" && (
                      <div>
                        <strong style={{ color: "#22c55e" }}>✓ Successfully Entered Lottery!</strong>
                        <p style={{ margin: "4px 0 0" }}>Your entry is recorded on the blockchain.</p>
                        <p style={{ margin: "4px 0 0" }}>Tx Hash: <code>{enterTxHash}</code></p>
                      </div>
                    )}
                    {enterTxStatus === "error" && enterError && (
                      <div>
                        <strong>⚠️ Entry Failed</strong>
                        <p style={{ margin: "4px 0 0" }}>{enterError}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ================================
                    ACTION BUTTON (State-Aware)
                ================================= */}
                {!isConnected ? (
                  <button
                    type="button"
                    className="enter-lottery-btn"
                    onClick={connectWallet}
                  >
                    Connect MetaMask to Enter
                    <span>→</span>
                  </button>
                ) : !isCorrectNetwork ? (
                  <button
                    type="button"
                    className="enter-lottery-btn"
                    onClick={() => switchNetwork(11155111)}
                  >
                    Switch to Sepolia Testnet
                    <span>→</span>
                  </button>
                ) : selectedLottery.winnerSelected ? (
                  <button
                    type="button"
                    className="enter-lottery-btn disabled"
                    disabled
                  >
                    🏆 Lottery Ended (Winner Drawn)
                  </button>
                ) : isUserCreator ? (
                  <button
                    type="button"
                    className="enter-lottery-btn disabled"
                    disabled
                  >
                    Creator (Cannot Enter Own Lottery)
                  </button>
                ) : isUserEntered ? (
                  <button
                    type="button"
                    className="enter-lottery-btn disabled"
                    disabled
                  >
                    ✓ Already Entered
                  </button>
                ) : selectedLottery.cancelled ? (
                  <button
                    type="button"
                    className="enter-lottery-btn disabled"
                    disabled
                  >
                    Lottery Cancelled
                  </button>
                ) : isClosed ? (
                  <button
                    type="button"
                    className="enter-lottery-btn disabled"
                    disabled
                  >
                    Lottery Closed (Full)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="enter-lottery-btn"
                    onClick={() => handleEnterLottery(selectedLottery)}
                    disabled={enteringId === selectedLottery.id}
                  >
                    {enteringId === selectedLottery.id ? (
                      <>
                        <span className="tx-spinner"></span>
                        <span>{enterTxStatus === "mining" ? "Mining Tx..." : "Confirming in MetaMask..."}</span>
                      </>
                    ) : (
                      <>
                        Enter Lottery ({selectedLottery.entryFee})
                        <span>→</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Dashboard;