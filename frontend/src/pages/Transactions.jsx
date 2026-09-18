import { useState } from "react";
import "./Transactions.css";

const transactionData = [
  {
    id: 1,
    date: "06 Sep 2026",
    time: "14:32",
    type: "Lottery Entry",
    icon: "↑",
    description: "Gaming Laptop",
    amount: "-0.05 ETH",
    direction: "sent",
    status: "SUCCESS",
    from: "0xA3F2...9D1c",
    to: "0x7bC4...1e9F",
    hash: "0x9dE1...4c2B",
    block: "5864321",
    gasUsed: "120,432",
    gasFee: "0.0018 ETH",
    dateTime: "06 Sep 2026 14:32:18",
  },
  {
    id: 2,
    date: "05 Sep 2026",
    time: "11:21",
    type: "Prize Claim",
    icon: "↓",
    description: "ETH Lottery",
    amount: "+1.00 ETH",
    direction: "received",
    status: "SUCCESS",
    from: "0x81B2...44AC",
    to: "0xA3F2...9D1c",
    hash: "0x72FA...91DE",
    block: "5861204",
    gasUsed: "86,421",
    gasFee: "0.0012 ETH",
    dateTime: "05 Sep 2026 11:21:42",
  },
  {
    id: 3,
    date: "04 Sep 2026",
    time: "09:15",
    type: "Lottery Entry",
    icon: "↑",
    description: "PlayStation 5",
    amount: "-0.03 ETH",
    direction: "sent",
    status: "SUCCESS",
    from: "0xA3F2...9D1c",
    to: "0x62CA...73AF",
    hash: "0x31BC...72AE",
    block: "5859312",
    gasUsed: "74,215",
    gasFee: "0.0010 ETH",
    dateTime: "04 Sep 2026 09:15:21",
  },
  {
    id: 4,
    date: "03 Sep 2026",
    time: "18:45",
    type: "Refund",
    icon: "↓",
    description: "Cancelled Lottery",
    amount: "+0.02 ETH",
    direction: "received",
    status: "SUCCESS",
    from: "0x19FA...73BD",
    to: "0xA3F2...9D1c",
    hash: "0x45BC...18DE",
    block: "5857120",
    gasUsed: "54,321",
    gasFee: "0.0007 ETH",
    dateTime: "03 Sep 2026 18:45:09",
  },
  {
    id: 5,
    date: "30 Aug 2026",
    time: "16:20",
    type: "Lottery Creation",
    icon: "↑",
    description: "iPhone 15 Pro Lottery",
    amount: "-0.004 ETH",
    direction: "sent",
    status: "SUCCESS",
    from: "0xA3F2...9D1c",
    to: "0xContract...82A1",
    hash: "0x82DE...18AC",
    block: "5852011",
    gasUsed: "160,132",
    gasFee: "0.004 ETH",
    dateTime: "30 Aug 2026 16:20:34",
  },
  {
    id: 6,
    date: "28 Aug 2026",
    time: "13:10",
    type: "Prize Claim",
    icon: "↓",
    description: "Weekly Lottery",
    amount: "+2.00 ETH",
    direction: "received",
    status: "SUCCESS",
    from: "0x71AC...18CD",
    to: "0xA3F2...9D1c",
    hash: "0x44CD...91FA",
    block: "5849320",
    gasUsed: "91,231",
    gasFee: "0.0013 ETH",
    dateTime: "28 Aug 2026 13:10:44",
  },
  {
    id: 7,
    date: "25 Aug 2026",
    time: "10:05",
    type: "Lottery Entry",
    icon: "↑",
    description: "Nike Air Jordan 1",
    amount: "-0.05 ETH",
    direction: "sent",
    status: "SUCCESS",
    from: "0xA3F2...9D1c",
    to: "0x19FA...73BD",
    hash: "0x62FD...74AC",
    block: "5845121",
    gasUsed: "72,421",
    gasFee: "0.0009 ETH",
    dateTime: "25 Aug 2026 10:05:17",
  },
  {
    id: 8,
    date: "20 Aug 2026",
    time: "21:37",
    type: "Prize Claim",
    icon: "↓",
    description: "Claim Prize",
    amount: "+1.50 ETH",
    direction: "received",
    status: "SUCCESS",
    from: "0x92EF...44BC",
    to: "0xA3F2...9D1c",
    hash: "0x91CE...32AF",
    block: "5839211",
    gasUsed: "82,132",
    gasFee: "0.0011 ETH",
    dateTime: "20 Aug 2026 21:37:28",
  },
];

function Transactions() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const filteredTransactions = transactionData
    .filter((transaction) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        transaction.type
          .toLowerCase()
          .includes(searchText) ||
        transaction.description
          .toLowerCase()
          .includes(searchText) ||
        transaction.hash
          .toLowerCase()
          .includes(searchText);

      const matchesTab =
        activeTab === "all" ||
        transaction.direction === activeTab;

      const matchesType =
        typeFilter === "all" ||
        transaction.type === typeFilter;

      return (
        matchesSearch &&
        matchesTab &&
        matchesType
      );
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return b.id - a.id;
      }

      return a.id - b.id;
    });

  return (
    <div className="transactions-page">

      {/* PAGE HEADER */}
      <div className="transactions-heading">

        <div>
          <h2>
            Transactions
          </h2>

          <p>
            View your complete wallet transaction history.
          </p>
        </div>

      </div>


      {/* SUMMARY CARDS */}
      <div className="transaction-summary">

        <div className="transaction-stat">

          <div className="transaction-stat-icon">
            ↑
          </div>

          <div className="transaction-stat-content">

            <span>Total Sent</span>

            <strong>
              -12.045 ETH
            </strong>

          </div>

        </div>


        <div className="transaction-stat">

          <div className="transaction-stat-icon">
            ↓
          </div>

          <div className="transaction-stat-content">

            <span>Total Received</span>

            <strong>
              +20.02 ETH
            </strong>

          </div>

        </div>


        <div className="transaction-stat">

          <div className="transaction-stat-icon">
            ▤
          </div>

          <div className="transaction-stat-content">

            <span>Total Transactions</span>

            <strong>
              28
            </strong>

          </div>

        </div>

      </div>


      {/* SENT / RECEIVED TABS */}
      <div className="transaction-tabs">

        <button
          type="button"
          className={
            activeTab === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("all")
          }
        >
          All
        </button>

        <button
          type="button"
          className={
            activeTab === "sent"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("sent")
          }
        >
          Sent
        </button>

        <button
          type="button"
          className={
            activeTab === "received"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("received")
          }
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
            placeholder="Search transactions..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value)
          }
        >
          <option value="all">
            Transaction Type
          </option>

          <option value="Lottery Entry">
            Lottery Entry
          </option>

          <option value="Lottery Creation">
            Lottery Creation
          </option>

          <option value="Prize Claim">
            Prize Claim
          </option>

          <option value="Refund">
            Refund
          </option>

        </select>


        <select
          value={dateFilter}
          onChange={(e) =>
            setDateFilter(e.target.value)
          }
        >
          <option value="all">
            Date
          </option>

          <option value="today">
            Today
          </option>

          <option value="week">
            This Week
          </option>

          <option value="month">
            This Month
          </option>

        </select>


        <select
          value={sortOrder}
          onChange={(e) =>
            setSortOrder(e.target.value)
          }
        >
          <option value="newest">
            Newest First
          </option>

          <option value="oldest">
            Oldest First
          </option>

        </select>

      </div>


      {/* MAIN CONTENT */}
      <div className="transaction-content">

        {/* TABLE */}
        <div className="transaction-table-wrapper">

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

              {filteredTransactions.map(
                (transaction) => (

                  <tr key={transaction.id}>

                    <td>
                      <div className="transaction-date">

                        <strong>
                          {transaction.date}
                        </strong>

                        <span>
                          {transaction.time}
                        </span>

                      </div>
                    </td>


                    <td>

                      <span
                        className={`transaction-type ${transaction.direction}`}
                      >

                        <span className="type-icon">
                          {transaction.icon}
                        </span>

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
                        onClick={() =>
                          setSelectedTransaction(
                            transaction
                          )
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>


          {filteredTransactions.length === 0 && (

            <div className="transaction-empty">

              <div>⌕</div>

              <h3>
                No transactions found
              </h3>

              <p>
                Try changing your search or filters.
              </p>

            </div>

          )}

        </div>


        {/* DETAILS PANEL */}
        {selectedTransaction && (

          <aside className="transaction-details">

            <div className="details-header">

              <h3>
                TRANSACTION DETAILS
              </h3>

              <button
                type="button"
                onClick={() =>
                  setSelectedTransaction(null)
                }
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

                <h3>
                  {selectedTransaction.type}
                </h3>

                <p>
                  {selectedTransaction.description}
                </p>

              </div>

              <span className="details-success">
                ● SUCCESS
              </span>

            </div>


            <div className="details-list">

              <div className="details-row">
                <span>Transaction Type</span>
                <strong>
                  {selectedTransaction.type}
                </strong>
              </div>

              <div className="details-row">
                <span>Amount</span>
                <strong
                  className={
                    selectedTransaction.direction
                  }
                >
                  {selectedTransaction.amount}
                </strong>
              </div>

              <div className="details-row">
                <span>Status</span>
                <strong className="success-text">
                  ● Success
                </strong>
              </div>

              <div className="details-row">
                <span>From Address</span>
                <strong>
                  {selectedTransaction.from}
                </strong>
              </div>

              <div className="details-row">
                <span>To Address</span>
                <strong>
                  {selectedTransaction.to}
                </strong>
              </div>

              <div className="details-row">
                <span>Transaction Hash</span>
                <strong>
                  {selectedTransaction.hash}
                </strong>
              </div>

              <div className="details-row">
                <span>Block Number</span>
                <strong>
                  {selectedTransaction.block}
                </strong>
              </div>

              <div className="details-row">
                <span>Gas Used</span>
                <strong>
                  {selectedTransaction.gasUsed}
                </strong>
              </div>

              <div className="details-row">
                <span>Date & Time</span>
                <strong>
                  {selectedTransaction.dateTime}
                </strong>
              </div>

            </div>


            <button
              type="button"
              className="details-close-button"
              onClick={() =>
                setSelectedTransaction(null)
              }
            >
              Close
            </button>

          </aside>

        )}

      </div>

    </div>
  );
}

export default Transactions;