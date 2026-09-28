import { useState } from "react";
import "./App.css";

import { Web3Provider, useWeb3 } from "./context/Web3Context";
import Sidebar from "./components/sidebar";
import Header from "./components/header";

import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import CreateLottery from "./pages/CreateLottery";
import History from "./pages/History";
import Transactions from "./pages/Transactions";
import ClaimPrize from "./pages/ClaimPrize";
import Profile from "./pages/Profile";
function AppContent() {
  const [enteredApp, setEnteredApp] = useState(() => {
    try {
      return sessionStorage.getItem("entered_app") === "true";
    } catch {
      return false;
    }
  });
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConnected } = useWeb3();

  const handleEnter = () => {
    try {
      sessionStorage.setItem("entered_app", "true");
    } catch {
      // ignore
    }
    setEnteredApp(true);
  };

  // If user has not explicitly entered and is not connected, show Landing
  if (!enteredApp && !isConnected) {
    return (
      <Landing
        onEnter={handleEnter}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "create":
        return <CreateLottery />;

      case "profile":
        return <Profile />;

      case "claim":
        return <ClaimPrize />;

      case "history":
        return <History />;

      case "transactions":
        return <Transactions />;

      case "dashboard":
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "create":
        return "Create Lottery";

      case "claim":
        return "Claim Prize";

      case "history":
        return "Lottery History";

      case "transactions":
        return "Transactions";

      case "profile":
        return "Profile";

      case "dashboard":
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <main className="main-content">
        <Header
          pageTitle={getPageTitle()}
          onMenuClick={() => setSidebarOpen((previous) => !previous)}
          onNavigate={setCurrentPage}
        />

        <section className="page-content">
          {renderPage()}
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;