import { useState } from "react";
import "./History.css";

const historyData = [
  {
    id: 1,
    lottery: "Gaming Laptop",
    category: "Technology",
    date: "06 Sep 2026",
    result: "WON",
    prize: "Gaming Laptop",
    status: "CLOSED",
    type: "participated",
    txHash: "0x8a72...91fd",
    description:
      "High-performance gaming laptop with powerful graphics and latest specifications.",
    entryFee: "0.05 ETH",
    participants: 99,
    maxParticipants: 100,
  },
  {
    id: 2,
    lottery: "PlayStation 5",
    category: "Gaming",
    date: "05 Sep 2026",
    result: "LOST",
    prize: "—",
    status: "CLOSED",
    type: "participated",
    txHash: "0x31bc...72ae",
    description:
      "Next-generation gaming console for an immersive gaming experience.",
    entryFee: "0.03 ETH",
    participants: 30,
    maxParticipants: 30,
  },
  {
    id: 3,
    lottery: "iPhone 15 Pro",
    category: "Technology",
    date: "04 Sep 2026",
    result: "PENDING",
    prize: "—",
    status: "ACTIVE",
    type: "participated",
    txHash: "0x92ef...44bc",
    description:
      "Premium smartphone with advanced camera and powerful performance.",
    entryFee: "0.04 ETH",
    participants: 45,
    maxParticipants: 80,
  },
  {
    id: 4,
    lottery: "1 ETH Giveaway",
    category: "Crypto",
    date: "03 Sep 2026",
    result: "WON",
    prize: "1 ETH",
    status: "CLOSED",
    type: "participated",
    txHash: "0x71ad...91ce",
    description:
      "Simulated Ethereum prize for educational blockchain demonstration.",
    entryFee: "0.01 ETH",
    participants: 25,
    maxParticipants: 25,
  },
  {
    id: 5,
    lottery: "MacBook Air",
    category: "Technology",
    date: "02 Sep 2026",
    result: "—",
    prize: "—",
    status: "ACTIVE",
    type: "created",
    txHash: "0x55bc...82de",
    description:
      "Powerful, portable and lightweight MacBook Air for everyday use.",
    entryFee: "0.02 ETH",
    participants: 18,
    maxParticipants: 50,
  },
  {
    id: 6,
    lottery: "AirPods Pro",
    category: "Technology",
    date: "31 Aug 2026",
    result: "—",
    prize: "—",
    status: "CLOSED",
    type: "created",
    txHash: "0x19fa...73bd",
    description:
      "Premium wireless earbuds with active noise cancellation.",
    entryFee: "0.005 ETH",
    participants: 100,
    maxParticipants: 100,
  },
];

function History() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedLottery, setSelectedLottery] = useState(null);

  const filteredHistory = historyData.filter((item) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      item.lottery.toLowerCase().includes(searchText) ||
      item.category.toLowerCase().includes(searchText) ||
      item.result.toLowerCase().includes(searchText) ||
      item.prize.toLowerCase().includes(searchText) ||
      item.status.toLowerCase().includes(searchText);

    let matchesFilter = true;

    if (filter === "winnings") {
      matchesFilter = item.result === "WON";
    }

    if (filter === "losses") {
      matchesFilter = item.result === "LOST";
    }

    if (filter === "my-lotteries") {
      matchesFilter = item.type === "created";
    }

    if (filter === "participated") {
      matchesFilter = item.type === "participated";
    }

    if (filter === "active") {
      matchesFilter = item.status === "ACTIVE";
    }

    if (filter === "closed") {
      matchesFilter = item.status === "CLOSED";
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="history-page">

      {/* PAGE HEADER */}
      <div className="history-heading">

        <div>
          <h2>
            Lottery <span>History</span>
          </h2>

          <p>
            Complete record of your lottery activity.
          </p>
        </div>

        <div className="history-count">
          {filteredHistory.length} Records
        </div>

      </div>


      {/* SUMMARY CARDS */}
      <div className="history-summary">

        <div className="history-stat">
          <span>My Entries</span>
          <strong>12</strong>
          <small>Lotteries participated</small>
        </div>

        <div className="history-stat">
          <span>Winnings</span>
          <strong>3</strong>
          <small>Lotteries won</small>
        </div>

        <div className="history-stat">
          <span>Losses</span>
          <strong>9</strong>
          <small>Lotteries lost</small>
        </div>

        <div className="history-stat">
          <span>My Lotteries</span>
          <strong>4</strong>
          <small>Created by you</small>
        </div>

      </div>


      {/* CONTROLS */}
      <div className="history-controls">

        <div className="history-search">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search lotteries..."
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
          <option value="my-lotteries">My Lotteries</option>
          <option value="participated">Participated</option>
          <option value="active">Active Lotteries</option>
          <option value="closed">Closed Lotteries</option>
        </select>

      </div>


      {/* HISTORY TABLE */}
      <div className="history-table-wrapper">

        <table className="history-table">

          <thead>

            <tr>
              <th>#</th>
              <th>Lottery</th>
              <th>Entry Date</th>
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

                    <strong>
                      {item.lottery}
                    </strong>

                    <span>
                      {item.category}
                    </span>

                  </div>

                </td>

                <td>
                  {item.date}
                </td>

                <td>

                  {item.result !== "—" && (
                    <span
                      className={`result-badge ${item.result.toLowerCase()}`}
                    >
                      {item.result}
                    </span>
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

                  <span className="tx-hash">
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


        {/* EMPTY STATE */}
        {filteredHistory.length === 0 && (

          <div className="history-empty">

            <div>⌕</div>

            <h3>
              No records found
            </h3>

            <p>
              Try changing your search or filter.
            </p>

          </div>

        )}

      </div>


      {/* =========================================
          LOTTERY DETAILS POPUP
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

                <span className="history-modal-category">
                  {selectedLottery.category}
                </span>

                <h2>
                  {selectedLottery.lottery}
                </h2>

                <p>
                  {selectedLottery.description}
                </p>

              </div>

            </div>


            {/* LOTTERY INFORMATION */}
            <div className="history-modal-info">

              <div className="history-modal-info-item">

                <span>
                  Prize
                </span>

                <strong>
                  {selectedLottery.prize !== "—"
                    ? selectedLottery.prize
                    : selectedLottery.lottery}
                </strong>

              </div>


              <div className="history-modal-info-item">

                <span>
                  Entry Fee
                </span>

                <strong>
                  {selectedLottery.entryFee}
                </strong>

              </div>


              <div className="history-modal-info-item">

                <span>
                  Participants
                </span>

                <strong>
                  {selectedLottery.participants} /{" "}
                  {selectedLottery.maxParticipants}
                </strong>

              </div>


              <div className="history-modal-info-item">

                <span>
                  Status
                </span>

                <strong
                  className={
                    selectedLottery.status === "ACTIVE"
                      ? "modal-active"
                      : "modal-closed"
                  }
                >
                  {selectedLottery.status}
                </strong>

              </div>


              <div className="history-modal-info-item">

                <span>
                  Entry Date
                </span>

                <strong>
                  {selectedLottery.date}
                </strong>

              </div>


              <div className="history-modal-info-item">

                <span>
                  Result
                </span>

                <strong
                  className={
                    selectedLottery.result === "WON"
                      ? "modal-won"
                      : selectedLottery.result === "LOST"
                      ? "modal-lost"
                      : "modal-pending"
                  }
                >
                  {selectedLottery.result}
                </strong>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default History;