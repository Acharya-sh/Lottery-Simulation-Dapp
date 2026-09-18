import { useState } from "react";
import "./App.css";

import Sidebar from "./components/sidebar";
import Header from "./components/header";

import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import CreateLottery from "./pages/CreateLottery";
import History from "./pages/History";
import Transactions from "./pages/Transactions";
import ClaimPrize from "./pages/ClaimPrize";
import Profile from "./pages/Profile";

function App() {
  const [enteredApp, setEnteredApp] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Sidebar open / close state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!enteredApp) {
    return (
      <Landing
        onEnter={() => setEnteredApp(true)}
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
          onMenuClick={() =>
            setSidebarOpen((previous) => !previous)
          }
        />

        <section className="page-content">
          {renderPage()}
        </section>

      </main>

    </div>
  );
}

export default App;