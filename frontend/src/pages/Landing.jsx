import "./Landing.css";
import { useWeb3 } from "../context/Web3Context";

function Landing({ onEnter }) {
  const { connectWallet, isConnecting, error } = useWeb3();
  const features = [
    {
      icon: "⬡",
      title: "Blockchain Based",
      text: "All lottery data and results are stored on-chain.",
    },
    {
      icon: "▤",
      title: "Create Lotteries",
      text: "Set your own prizes, entry fee and rules in seconds.",
    },
    {
      icon: "♟",
      title: "Participate",
      text: "Join lotteries created by other users.",
    },
    {
      icon: "♜",
      title: "Random / Manual Winner",
      text: "Fair winner selection through smart contract.",
    },
    {
      icon: "🎁",
      title: "Physical & ETH Prizes",
      text: "Win simulated real-world prizes and test ETH rewards.",
    },
    {
      icon: "▤",
      title: "On-Chain Records",
      text: "Transparent and tamper-proof history for everyone.",
    },
  ];

  /* =========================================================
     FLOATING CRYPTO COINS
  ========================================================= */

  const coins = [
    {
      image: "/coins/bitcoin.png",
      className: "coin-1",
      alt: "Bitcoin",
    },
    {
      image: "/coins/ethereum.png",
      className: "coin-2",
      alt: "Ethereum",
    },
    {
      image: "/coins/binance.png",
      className: "coin-3",
      alt: "BNB",
    },
    {
      image: "/coins/xrp.png",
      className: "coin-4",
      alt: "XRP",
    },
    {
      image: "/coins/sol.png",
      className: "coin-5",
      alt: "Solana",
    },
    {
      image: "/coins/cardano.png",
      className: "coin-6",
      alt: "Cardano",
    },
    {
      image: "/coins/dogecoin.png",
      className: "coin-7",
      alt: "Dogecoin",
    },
    {
      image: "/coins/polygon.png",
      className: "coin-8",
      alt: "Polygon",
    },
    {
      image: "/coins/bitcoin.png",
      className: "coin-9",
      alt: "Bitcoin",
    },
    {
      image: "/coins/ethereum.png",
      className: "coin-10",
      alt: "Ethereum",
    },
  ];

  return (
    <div className="landing-page">

      {/* =====================================================
          FLOATING CRYPTOCURRENCY BACKGROUND
      ===================================================== */}

      <div
        className="crypto-background"
        aria-hidden="true"
      >
        {coins.map((coin) => (
          <div
            key={coin.className}
            className={`crypto-coin ${coin.className}`}
          >
            <img
              src={coin.image}
              alt={coin.alt}
            />
          </div>
        ))}
      </div>


      {/* =====================================================
          BACKGROUND EFFECTS
      ===================================================== */}

      <div className="landing-glow landing-glow-left" />
      <div className="landing-glow landing-glow-right" />
      <div className="landing-particles" />


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="landing-content">

        {/* Logo */}
        <div className="landing-logo-wrapper">
          <img
            src="/logo_lsd.png"
            alt="LSD Lottery Simulation DApp"
            className="landing-logo"
          />
        </div>


        {/* Title */}
        <h1 className="landing-title">
          Lottery <span>$</span>imulation DApp
        </h1>


        {/* Tagline */}
        <p className="landing-tagline">
          Decentralized. Transparent. Fair. Fun.
        </p>


        {/* Quote */}
        <div className="landing-quote">
          <span>“</span> Win Exciting Prizes <span>”</span>
        </div>


        {/* Connect MetaMask */}
        <button
          className="metamask-button"
          onClick={async () => {
            await connectWallet();
            onEnter();
          }}
          disabled={isConnecting}
        >
          <span className="metamask-icon">🦊</span>

          <span>{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>

          <span className="button-arrow">→</span>
        </button>

        {error && (
          <p className="landing-error" style={{ color: "#ff6b6b", marginTop: "10px", fontSize: "14px" }}>
            {error}
          </p>
        )}

        {/* Test cryptocurrency note */}
        <p className="test-note">
          Start playing with test cryptocurrency
        </p>


        {/* Description */}
        <p className="landing-description">
          A modern multi-user blockchain lottery simulation where you can
          create your own lotteries and participate in others using test
          cryptocurrency. Win exciting simulated prizes and experience how
          blockchain ensures fairness, transparency, and trust.
        </p>


        {/* ===================================================
            FEATURES
        =================================================== */}

        <section className="feature-grid">

          {features.map((feature) => (
            <article
              className="feature-card"
              key={feature.title}
            >

              <div className="feature-icon">
                {feature.icon}
              </div>

              <h2>
                {feature.title}
              </h2>

              <p>
                {feature.text}
              </p>

            </article>
          ))}

        </section>

      </main>
    </div>
  );
}

export default Landing;