function Sidebar({ currentPage, onNavigate, isOpen, onClose }) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      id: "create",
      label: "Create Lottery",
      icon: "▣",
    },
    {
      id: "history",
      label: "History",
      icon: "◷",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: "▤",
    },
    {
      id: "claim",
      label: "Claim Prizes",
      icon: "◆",
    },
    {
      id: "profile",
      label: "Profile",
      icon: "●",
    },
  ];

  const handleNavigation = (page) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay - NO BLUR */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

        {/* Logo */}
        <div className="logo-area">
          <img
            src="/logo_lsd.png"
            alt="LSD Lottery Simulation DApp"
            className="sidebar-logo"
          />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">

          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                currentPage === item.id ? "active" : ""
              }`}
              onClick={() => handleNavigation(item.id)}
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span className="nav-label">
                {item.label}
              </span>
            </button>
          ))}

        </nav>

      </aside>
    </>
  );
}

export default Sidebar;