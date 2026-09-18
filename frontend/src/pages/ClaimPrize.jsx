import { useState } from "react";
import "./ClaimPrize.css";

const prizeData = [
  {
    id: 1,
    lotteryId: "#001",
    name: "Gaming Laptop",
    description:
      "High-performance gaming laptop with powerful graphics and latest specs.",
    type: "Physical Prize",
    value: "$1,200 USD",
    date: "06 Sep 2026",
    status: "UNCLAIMED",
    image:
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    lotteryId: "#004",
    name: "1 ETH Giveaway",
    description:
      "Simulated ETH prize transferred through the lottery smart contract.",
    type: "ETH Prize",
    value: "1 ETH",
    date: "03 Sep 2026",
    status: "CLAIMED",
    image:
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    lotteryId: "#007",
    name: "PlayStation 5",
    description:
      "Next-generation gaming console for an immersive gaming experience.",
    type: "Physical Prize",
    value: "$499 USD",
    date: "28 Aug 2026",
    status: "UNCLAIMED",
    image:
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80",
  },
];

function ClaimPrizes() {
  const [selectedPrize, setSelectedPrize] = useState(null);

  const [prizes, setPrizes] = useState(prizeData);

  const handleClaim = (id) => {
    setPrizes((currentPrizes) =>
      currentPrizes.map((prize) =>
        prize.id === id
          ? { ...prize, status: "CLAIMED" }
          : prize
      )
    );
  };

  return (
    <div className="claim-prizes-page">

      {/* PAGE HEADER */}
      <div className="claim-heading">

        <div>
          <h2>
            Claim <span>Prizes</span>
          </h2>

          <p>
            View and claim prizes you have won.
          </p>
        </div>

        <div className="prize-count">
          {prizes.length} Prizes Won
        </div>

      </div>


      {/* SUMMARY */}
      <div className="claim-summary">

        <div className="claim-stat">

          <span>Prizes Won</span>

          <strong>
            {prizes.length}
          </strong>

          <small>
            Total prizes won
          </small>

        </div>


        <div className="claim-stat">

          <span>Unclaimed</span>

          <strong>
            {
              prizes.filter(
                (prize) =>
                  prize.status === "UNCLAIMED"
              ).length
            }
          </strong>

          <small>
            Awaiting your claim
          </small>

        </div>


        <div className="claim-stat">

          <span>Claimed</span>

          <strong>
            {
              prizes.filter(
                (prize) =>
                  prize.status === "CLAIMED"
              ).length
            }
          </strong>

          <small>
            Successfully claimed
          </small>

        </div>

      </div>


      {/* PRIZE LIST */}
      <div className="prize-list">

        {prizes.map((prize) => (

          <div
            className="prize-card"
            key={prize.id}
          >

            {/* IMAGE */}
            <div className="prize-image">

              <img
                src={prize.image}
                alt={prize.name}
              />

              <span
                className={`prize-status ${prize.status.toLowerCase()}`}
              >
                {prize.status}
              </span>

            </div>


            {/* CONTENT */}
            <div className="prize-content">

              <div className="prize-top">

                <div>
                  <span className="lottery-id">
                    Lottery {prize.lotteryId}
                  </span>

                  <h3>
                    {prize.name}
                  </h3>
                </div>

                <span className="prize-type">
                  {prize.type}
                </span>

              </div>


              <p className="prize-description">
                {prize.description}
              </p>


              <div className="prize-info">

                <div>
                  <span>Prize Value</span>
                  <strong>
                    {prize.value}
                  </strong>
                </div>

                <div>
                  <span>Won Date</span>
                  <strong>
                    {prize.date}
                  </strong>
                </div>

              </div>


              <div className="prize-actions">

                <button
                  type="button"
                  className="prize-view-button"
                  onClick={() =>
                    setSelectedPrize(prize)
                  }
                >
                  View
                </button>


                {prize.status === "UNCLAIMED" ? (

                  <button
                    type="button"
                    className="prize-claim-button"
                    onClick={() =>
                      handleClaim(prize.id)
                    }
                  >
                    Claim Prize
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

        ))}

      </div>


      {/* EMPTY STATE */}
      {prizes.length === 0 && (

        <div className="claim-empty">

          <div className="claim-empty-icon">
            🏆
          </div>

          <h3>
            No Prizes Won Yet
          </h3>

          <p>
            Your winning prizes will appear here
            once you win a lottery.
          </p>

        </div>

      )}


      {/* DETAILS MODAL */}
      {selectedPrize && (

        <div
          className="prize-modal-overlay"
          onClick={() =>
            setSelectedPrize(null)
          }
        >

          <div
            className="prize-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setSelectedPrize(null)
              }
            >
              ×
            </button>


            <img
              src={selectedPrize.image}
              alt={selectedPrize.name}
              className="modal-prize-image"
            />


            <div className="modal-prize-content">

              <span className="lottery-id">
                Lottery {selectedPrize.lotteryId}
              </span>

              <h3>
                {selectedPrize.name}
              </h3>

              <p>
                {selectedPrize.description}
              </p>


              <div className="modal-details">

                <div>
                  <span>Prize Type</span>
                  <strong>
                    {selectedPrize.type}
                  </strong>
                </div>

                <div>
                  <span>Prize Value</span>
                  <strong>
                    {selectedPrize.value}
                  </strong>
                </div>

                <div>
                  <span>Date Won</span>
                  <strong>
                    {selectedPrize.date}
                  </strong>
                </div>

                <div>
                  <span>Claim Status</span>
                  <strong
                    className={
                      selectedPrize.status ===
                      "CLAIMED"
                        ? "claimed-text"
                        : "unclaimed-text"
                    }
                  >
                    {selectedPrize.status}
                  </strong>
                </div>

              </div>


              {/* ORGANIZER CONTACT */}
              {selectedPrize.status ===
                "CLAIMED" &&
                selectedPrize.type ===
                  "Physical Prize" && (

                  <div className="organizer-contact">

                    <strong>
                      Organizer Contact
                    </strong>

                    <span>
                      organizer@example.com
                    </span>

                    <small>
                      Contact the organizer for
                      physical prize delivery.
                    </small>

                  </div>

                )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default ClaimPrizes;