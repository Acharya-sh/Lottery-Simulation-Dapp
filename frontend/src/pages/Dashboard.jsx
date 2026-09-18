import { useState } from "react";
import mockLotteries from "../data/mockLotteries";
import "./Dashboard.css";

function Dashboard() {

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Selected lottery for details popup
  const [selectedLottery, setSelectedLottery] = useState(null);


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
     FILTER + SORT
  ================================= */

  const filteredLotteries = mockLotteries

    .filter((lottery) => {

      const searchText =
        search.toLowerCase().trim();


      /*
        Search through:
        - Prize name
        - Description
        - Category
      */

      const searchableText = `
        ${lottery.prizeName || ""}
        ${lottery.description || ""}
        ${lottery.category || ""}
      `.toLowerCase();


      const matchesSearch =
        searchText === "" ||
        searchableText.includes(searchText);


      const matchesCategory =
        category === "All" ||
        lottery.category === category;


      return (
        matchesSearch &&
        matchesCategory
      );

    })


    .sort((a, b) => {

      switch (sortBy) {

        case "entry-low":
          return (
            parseFloat(a.entryFee) -
            parseFloat(b.entryFee)
          );


        case "participants":
          return (
            b.participants -
            a.participants
          );


        case "newest":

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
          Discover, participate, and win
          exciting prizes.
        </p>

      </section>


      {/* ================================
          SEARCH + CATEGORY
      ================================= */}

      <div className="dashboard-search-row">


        {/* Search */}

        <div className="search-wrapper">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search for lotteries (e.g. iPhone, Gaming, Crypto, Car...)"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        {/* Category */}

        <div className="select-wrapper">

          <span className="select-icon">
            ☷
          </span>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >

            {categories.map((item) => (

              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Categories"
                  : item}
              </option>

            ))}

          </select>

          <span className="select-arrow">
            ⌄
          </span>

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
              Join exciting lotteries and stand
              a chance to win amazing prizes!
            </p>

          </div>


          {/* Sort */}

          <div className="sort-wrapper">

            <span className="sort-label">
              Sort by
            </span>


            <div className="select-wrapper sort-select">

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >

                <option value="newest">
                  Newest
                </option>

                <option value="entry-low">
                  Lowest Entry Fee
                </option>

                <option value="participants">
                  Most Participants
                </option>

              </select>


              <span className="select-arrow">
                ⌄
              </span>

            </div>

          </div>

        </div>


        {/* ================================
            LOTTERY CARDS
        ================================= */}

        <div className="lottery-grid">


          {filteredLotteries.map(
            (lottery) => (

              <article
                className="lottery-card"
                key={lottery.id}
              >


                {/* IMAGE */}

                <div className="lottery-image-wrapper">

                  <img
                    src={lottery.image}
                    alt={lottery.prizeName}
                    className="lottery-image"
                  />

                  <span className="category-badge">
                    {lottery.category}
                  </span>

                </div>


                {/* CARD BODY */}

                <div className="lottery-card-body">


                  <h3>
                    {lottery.prizeName}
                  </h3>


                  <p className="lottery-description">
                    {lottery.description}
                  </p>


                  {/* INFORMATION */}

                  <div className="lottery-info">


                    <div className="info-item">

                      <span>
                        ◆
                      </span>

                      <div>

                        <strong>
                          {lottery.entryFee}
                        </strong>

                        <small>
                          Entry Fee
                        </small>

                      </div>

                    </div>


                    <div className="info-item">

                      <span>
                        👥
                      </span>

                      <div>

                        <strong>
                          {lottery.participants}
                          {" / "}
                          {lottery.maxParticipants}
                        </strong>

                        <small>
                          Participants
                        </small>

                      </div>

                    </div>

                  </div>


                  {/* PROGRESS */}

                  <div className="progress-bar">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          (
                            lottery.participants /
                            lottery.maxParticipants
                          ) * 100,
                          100
                        )}%`,
                      }}
                    />

                  </div>


                  {/* FOOTER */}

                  <div className="lottery-footer">

                    <span className="time-left">
                      ◷ {lottery.timeLeft}
                    </span>


                    <button
                      type="button"
                      className="view-btn"
                      onClick={() =>
                        setSelectedLottery(lottery)
                      }
                    >
                      View Details
                      <span>→</span>
                    </button>

                  </div>

                </div>

              </article>

            )
          )}

        </div>


        {/* ================================
            EMPTY STATE
        ================================= */}

        {filteredLotteries.length === 0 && (

          <div className="empty-state">

            <div className="empty-icon">
              ◇
            </div>

            <h3>
              No lotteries found
            </h3>

            <p>
              Try a different search or category.
            </p>

          </div>

        )}

      </section>


      {/* =================================================
          LOTTERY DETAILS POPUP
      ================================================= */}

      {selectedLottery && (

        <div
          className="lottery-modal-overlay"
          onClick={() =>
            setSelectedLottery(null)
          }
        >

          <div
            className="lottery-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            {/* ================================
                CLOSE BUTTON
            ================================= */}

            <button
              type="button"
              className="lottery-modal-close"
              onClick={() =>
                setSelectedLottery(null)
              }
              aria-label="Close lottery details"
            >
              ×
            </button>


            {/* ================================
                MODAL IMAGE
            ================================= */}

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


            {/* ================================
                MODAL CONTENT
            ================================= */}

            <div className="lottery-modal-content">


              <h2>
                {selectedLottery.prizeName}
              </h2>


              <p className="modal-description">
                {selectedLottery.description}
              </p>


              {/* Details */}

              <div className="modal-details-grid">


                <div className="modal-detail">

                  <span>
                    Entry Fee
                  </span>

                  <strong>
                    {selectedLottery.entryFee}
                  </strong>

                </div>


                <div className="modal-detail">

                  <span>
                    Participants
                  </span>

                  <strong>
                    {selectedLottery.participants}
                    {" / "}
                    {selectedLottery.maxParticipants}
                  </strong>

                </div>


                <div className="modal-detail">

                  <span>
                    Time Left
                  </span>

                  <strong>
                    {selectedLottery.timeLeft}
                  </strong>

                </div>


                <div className="modal-detail">

                  <span>
                    Lottery ID
                  </span>

                  <strong>
                    #{selectedLottery.id}
                  </strong>

                </div>


                {selectedLottery.prizeType && (

                  <div className="modal-detail">

                    <span>
                      Prize Type
                    </span>

                    <strong>
                      {selectedLottery.prizeType}
                    </strong>

                  </div>

                )}


                {selectedLottery.prizeValue && (

                  <div className="modal-detail">

                    <span>
                      Prize Value
                    </span>

                    <strong>
                      {selectedLottery.prizeValue}
                    </strong>

                  </div>

                )}


                {selectedLottery.organizer && (

                  <div className="modal-detail modal-detail-full">

                    <span>
                      Organizer
                    </span>

                    <strong>
                      {selectedLottery.organizer}
                    </strong>

                  </div>

                )}

              </div>


              {/* Progress */}

              <div className="modal-progress-section">

                <div className="modal-progress-header">

                  <span>
                    Participation Progress
                  </span>

                  <strong>
                    {selectedLottery.participants}
                    {" / "}
                    {selectedLottery.maxParticipants}
                  </strong>

                </div>


                <div className="progress-bar modal-progress">

                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        (
                          selectedLottery.participants /
                          selectedLottery.maxParticipants
                        ) * 100,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>


              {/* ================================
                  ENTER LOTTERY
              ================================= */}

              <button
                type="button"
                className="enter-lottery-btn"
                onClick={() => {
                  alert(
                    "Lottery entry will be connected to MetaMask and the smart contract."
                  );
                }}
              >
                Enter Lottery
                <span>→</span>
              </button>


            </div>

          </div>

        </div>

      )}

    </div>

  );
}

export default Dashboard;