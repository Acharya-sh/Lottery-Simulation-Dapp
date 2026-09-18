import { useState, useEffect, useCallback } from "react";
import "./ClaimPrize.css";
import { useWeb3 } from "../context/Web3Context";
import { fetchUserWinnings } from "../services/lotteryService";
import { truncateAddress } from "../services/web3Service";

function ClaimPrizes() {
  const {
    contract,
    web3,
    account,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    switchNetwork,
    refreshBalance,
  } = useWeb3();

  const [prizes, setPrizes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Selected prize for details popup
  const [selectedPrize, setSelectedPrize] = useState(null);

  // Transaction state
  const [claimingId, setClaimingId] = useState(null);
  const [claimTxStatus, setClaimTxStatus] = useState(null); // null | "waiting-metamask" | "mining" | "success" | "error"
  const [claimTxHash, setClaimTxHash] = useState(null);
  const [claimError, setClaimError] = useState(null);

  /* ================================
     FETCH WINNINGS ON-CHAIN
  ================================= */
  const loadWinnings = useCallback(async () => {
    if (!contract || !account) {
      if (!isCorrectNetwork && isConnected) {
        setLoadError("Smart contract not found on this network. Please switch to Ganache Local (1337) or Sepolia.");
      } else if (!isConnected) {
        setLoadError(null);
        setPrizes([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchUserWinnings(contract, web3, account);
      setPrizes(data);
    } catch (err) {
      console.error("Failed to load user winnings from blockchain:", err);
      setLoadError("Failed to read your winnings from the smart contract. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, [contract, web3, account, isConnected, isCorrectNetwork]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadWinnings();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadWinnings]);

  /* ================================
     CLAIM PRIZE HANDLER
  ================================= */
  const handleClaim = async (prize) => {
    if (!contract || !account || claimingId) return;

    if (!prize || prize.prizeClaimed) return;
    if (prize.winner.toLowerCase() !== account.toLowerCase()) {
      setClaimError("You are not the designated winner for this prize.");
      setClaimTxStatus("error");
      return;
    }

    setClaimingId(prize.id);
    setClaimTxStatus("waiting-metamask");
    setClaimError(null);
    setClaimTxHash(null);

    try {
      const txPromise = contract.methods.claimPrize(prize.id).send({
        from: account,
      });

      txPromise.on("transactionHash", (hash) => {
        setClaimTxHash(hash);
        setClaimTxStatus("mining");
      });

      const receipt = await txPromise;
      setClaimTxHash(receipt.transactionHash);
      setClaimTxStatus("success");

      // Re-fetch winnings from contract
      await loadWinnings();

      // Refresh wallet balance if ETH prize
      if (refreshBalance && prize.prizeTypeNum === 1) {
        await refreshBalance();
      }

      // Update selectedPrize if modal is currently open for this prize
      setSelectedPrize((prev) => {
        if (!prev || prev.id !== prize.id) return prev;
        return {
          ...prev,
          prizeClaimed: true,
          status: "CLAIMED",
        };
      });
    } catch (err) {
      console.error("Claim prize error:", err);
      setClaimTxStatus("error");
      if (err.code === 4001) {
        setClaimError("Transaction was rejected in MetaMask.");
      } else if (err.message && err.message.includes("insufficient funds")) {
        setClaimError("Insufficient funds for gas fees.");
      } else {
        setClaimError(err.message || "Failed to claim prize on the blockchain.");
      }
    } finally {
      setClaimingId(null);
    }
  };

  const handleOpenModal = (prize) => {
    setSelectedPrize(prize);
    setClaimTxStatus(null);
    setClaimTxHash(null);
    setClaimError(null);
  };

  const handleCloseModal = () => {
    setSelectedPrize(null);
    setClaimTxStatus(null);
    setClaimTxHash(null);
    setClaimError(null);
  };

  const unclaimedCount = prizes.filter((p) => p.status === "UNCLAIMED").length;
  const claimedCount = prizes.filter((p) => p.status === "CLAIMED").length;

  return (
    <div className="claim-prizes-page">
      {/* PAGE HEADER */}
      <div className="claim-heading">
        <div>
          <h2>
            Claim <span>Prizes</span>
          </h2>
          <p>View and claim blockchain prizes you have won.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            className="refresh-btn"
            onClick={loadWinnings}
            disabled={isLoading}
            title="Refresh winnings from smart contract"
          >
            ↻ Refresh
          </button>
          <div className="prize-count">{prizes.length} Prizes Won</div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {loadError && (
        <div className="claim-error-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>⚠️</span>
            <span>{loadError}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {!isCorrectNetwork && isConnected && (
              <button
                type="button"
                onClick={() => switchNetwork(1337)}
                style={{
                  background: "#e1b52a",
                  color: "#050505",
                  fontWeight: "600",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Switch Network
              </button>
            )}
            <button
              type="button"
              onClick={loadWinnings}
              style={{
                background: "#1a1a1a",
                color: "#eee",
                border: "1px solid #333",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* NOT CONNECTED NOTICE */}
      {!isConnected && (
        <div
          className="claim-error-banner"
          style={{
            background: "rgba(212, 169, 38, 0.08)",
            borderColor: "rgba(212, 169, 38, 0.3)",
            color: "#e6b91e",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>🦊</span>
            <span>Connect your MetaMask wallet to view your winning lotteries and claim prizes.</span>
          </div>
          <button
            type="button"
            onClick={connectWallet}
            style={{
              background: "#e6b91e",
              color: "#050505",
              fontWeight: "700",
              padding: "7px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Connect MetaMask
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="claim-summary">
        <div className="claim-stat">
          <span>Prizes Won</span>
          <strong>{prizes.length}</strong>
          <small>Total prizes won on-chain</small>
        </div>

        <div className="claim-stat">
          <span>Unclaimed</span>
          <strong style={{ color: "#e6b91e" }}>{unclaimedCount}</strong>
          <small>Awaiting your claim</small>
        </div>

        <div className="claim-stat">
          <span>Claimed</span>
          <strong style={{ color: "#20d994" }}>{claimedCount}</strong>
          <small>Successfully claimed</small>
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="claim-loading">
          <div className="claim-spinner"></div>
          <p style={{ color: "#c8c8c8", fontSize: "14px" }}>
            Reading your winnings from the smart contract...
          </p>
        </div>
      )}

      {/* PRIZE LIST */}
      {!isLoading && (
        <div className="prize-list">
          {prizes.map((prize) => {
            const isWinner =
              account && prize.winner.toLowerCase() === account.toLowerCase();
            const isPendingThis = claimingId === prize.id;

            return (
              <div className="prize-card" key={prize.id}>
                {/* IMAGE */}
                <div className="prize-image">
                  <img src={prize.image} alt={prize.name} />
                  <span className={`prize-status ${prize.status.toLowerCase()}`}>
                    {prize.status}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="prize-content">
                  <div className="prize-top">
                    <div>
                      <span className="lottery-id">Lottery {prize.lotteryId}</span>
                      <h3>{prize.name}</h3>
                    </div>

                    <span className="prize-type">{prize.type}</span>
                  </div>

                  <p className="prize-description">{prize.description}</p>

                  <div className="prize-info">
                    <div>
                      <span>Prize Value</span>
                      <strong style={{ color: prize.prizeTypeNum === 1 ? "#e6b91e" : "#eee" }}>
                        {prize.value}
                      </strong>
                    </div>

                    <div>
                      <span>Claim Status</span>
                      <strong
                        className={
                          prize.status === "CLAIMED"
                            ? "claimed-text"
                            : "unclaimed-text"
                        }
                      >
                        {prize.status}
                      </strong>
                    </div>
                  </div>

                  {/* Card Tx Feedback */}
                  {isPendingThis && claimTxStatus && (
                    <div
                      className={`tx-status-card ${claimTxStatus}`}
                      style={{ marginTop: "12px", fontSize: "12px" }}
                    >
                      {claimTxStatus === "waiting-metamask" && (
                        <div>
                          <span className="tx-spinner"></span>
                          <strong>Confirm claim in MetaMask...</strong>
                        </div>
                      )}
                      {claimTxStatus === "mining" && (
                        <div>
                          <span className="tx-spinner"></span>
                          <strong>Mining claim transaction...</strong>
                        </div>
                      )}
                      {claimTxStatus === "error" && claimError && (
                        <div>
                          <strong>⚠️ Claim Failed:</strong> {claimError}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="prize-actions">
                    <button
                      type="button"
                      className="prize-view-button"
                      onClick={() => handleOpenModal(prize)}
                    >
                      View Details
                    </button>

                    {prize.status === "UNCLAIMED" ? (
                      <button
                        type="button"
                        className="prize-claim-button"
                        onClick={() => handleClaim(prize)}
                        disabled={!isWinner || Boolean(claimingId)}
                      >
                        {isPendingThis ? (
                          <>
                            <span className="tx-spinner"></span>
                            <span>Claiming...</span>
                          </>
                        ) : (
                          "Claim Prize"
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="prize-claimed-button"
                        disabled
                      >
                        ✓ CLAIMED
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && prizes.length === 0 && (
        <div className="claim-empty">
          <div className="claim-empty-icon">🏆</div>
          <h3>No Prizes Won Yet</h3>
          <p>
            Your winning prizes will automatically appear here once you are drawn as
            the winner of a lottery on the blockchain.
          </p>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedPrize && (
        <div className="prize-modal-overlay" onClick={handleCloseModal}>
          <div className="prize-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              ×
            </button>

            <img
              src={selectedPrize.image}
              alt={selectedPrize.name}
              className="modal-prize-image"
            />

            <div className="modal-prize-content">
              <span className="lottery-id">Lottery {selectedPrize.lotteryId}</span>
              <h3>{selectedPrize.name}</h3>
              <p>{selectedPrize.description}</p>

              <div className="modal-details">
                <div>
                  <span>Prize Type</span>
                  <strong>{selectedPrize.type}</strong>
                </div>

                <div>
                  <span>Prize Value</span>
                  <strong style={{ color: selectedPrize.prizeTypeNum === 1 ? "#e6b91e" : "#ddd" }}>
                    {selectedPrize.value}
                  </strong>
                </div>

                <div>
                  <span>Claim Status</span>
                  <strong
                    className={
                      selectedPrize.status === "CLAIMED"
                        ? "claimed-text"
                        : "unclaimed-text"
                    }
                  >
                    {selectedPrize.status}
                  </strong>
                </div>

                <div>
                  <span>Winner Address</span>
                  <strong>{truncateAddress(selectedPrize.winner)} (You)</strong>
                </div>

                <div>
                  <span>Organizer</span>
                  <strong>{truncateAddress(selectedPrize.creator)}</strong>
                </div>
              </div>

              {/* ETH PRIZE EXPLANATION */}
              {selectedPrize.prizeTypeNum === 1 && (
                <div className="eth-claim-note">
                  {selectedPrize.status === "CLAIMED" ? (
                    <>
                      <span>✓ ETH Prize Transferred</span>
                      <small>
                        The ETH prize of {selectedPrize.value} was transferred directly to your connected wallet by the smart contract.
                      </small>
                    </>
                  ) : (
                    <>
                      <span>💰 Smart Contract ETH Transfer</span>
                      <small>
                        Clicking "Claim Prize" will trigger a direct on-chain transfer of {selectedPrize.value} from the smart contract to your wallet.
                      </small>
                    </>
                  )}
                </div>
              )}

              {/* PHYSICAL / CRYPTO PRIZE ORGANIZER CONTACT */}
              {selectedPrize.prizeTypeNum !== 1 && (
                <>
                  {selectedPrize.status === "CLAIMED" ? (
                    <div className="organizer-contact">
                      <strong>📦 Organizer Contact (Off-Chain Prize Delivery)</strong>
                      <span>{selectedPrize.organizerContact || "No contact info provided by organizer"}</span>
                      <small>
                        Your claim is confirmed on-chain! Please reach out to the organizer using the contact above to arrange collection or delivery of your prize.
                      </small>
                    </div>
                  ) : (
                    <div className="organizer-contact-locked">
                      <span>🔒 Organizer Contact Hidden</span>
                      <small>
                        Claim this prize on-chain to reveal the organizer's verified contact information for off-chain collection and delivery.
                      </small>
                    </div>
                  )}
                </>
              )}

              {/* Modal Tx Feedback */}
              {claimTxStatus && claimingId === selectedPrize.id && (
                <div className={`tx-status-card ${claimTxStatus}`} style={{ marginTop: "14px" }}>
                  {claimTxStatus === "waiting-metamask" && (
                    <div>
                      <span className="tx-spinner"></span>
                      <strong>Confirm claim in MetaMask...</strong>
                      <p style={{ margin: "4px 0 0", color: "#c8c8c8" }}>
                        Please confirm the claim transaction in your wallet.
                      </p>
                    </div>
                  )}
                  {claimTxStatus === "mining" && (
                    <div>
                      <span className="tx-spinner"></span>
                      <strong>Claim transaction is being mined on the blockchain...</strong>
                      <p style={{ margin: "4px 0 0" }}>Tx Hash: <code>{claimTxHash}</code></p>
                    </div>
                  )}
                  {claimTxStatus === "success" && (
                    <div>
                      <strong style={{ color: "#22c55e" }}>✓ Prize Successfully Claimed!</strong>
                      <p style={{ margin: "4px 0 0" }}>Your claim is confirmed on the blockchain.</p>
                      <p style={{ margin: "4px 0 0" }}>Tx Hash: <code>{claimTxHash}</code></p>
                    </div>
                  )}
                  {claimTxStatus === "error" && claimError && (
                    <div>
                      <strong>⚠️ Claim Failed</strong>
                      <p style={{ margin: "4px 0 0" }}>{claimError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Action Button */}
              {selectedPrize.status === "UNCLAIMED" ? (
                <button
                  type="button"
                  className="claim-modal-action-btn"
                  onClick={() => handleClaim(selectedPrize)}
                  disabled={Boolean(claimingId)}
                >
                  {claimingId === selectedPrize.id ? (
                    <>
                      <span className="tx-spinner"></span>
                      <span>Claiming on Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <span>Claim Prize ({selectedPrize.value})</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="claim-modal-action-btn"
                  disabled
                >
                  ✓ Prize Successfully Claimed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimPrizes;