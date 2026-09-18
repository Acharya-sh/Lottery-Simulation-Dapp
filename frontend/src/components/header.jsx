import { useState } from "react";

function Header({ pageTitle, onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false);

  // Empty for now.
  // Later these can come from blockchain lottery events.
  const notifications = [];

  return (
    <header className="header">

      {/* ================================
          HEADER LEFT
      ================================= */}

      <div className="header-left">

        {/* Hamburger */}
        <button
          type="button"
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>


        {/* LSD Logo */}
        <img
          src="/logo_lsd.png"
          alt="LSD"
          className="header-logo"
        />


        {/* Page Title */}
        <h1>{pageTitle}</h1>

      </div>


      {/* ================================
          HEADER RIGHT
      ================================= */}

      <div className="header-actions">

        {/* Notification Wrapper */}
        <div className="notification-wrapper">

          {/* Notification Button */}
          <button
            type="button"
            className="notification-btn"
            aria-label="Notifications"
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
          >
            🔔
          </button>


          {/* ================================
              NOTIFICATION POPUP
          ================================= */}

          {showNotifications && (

            <div className="notification-popup">

              <div className="notification-header">

                <h3>
                  Notifications
                </h3>

                <button
                  type="button"
                  className="notification-close"
                  onClick={() =>
                    setShowNotifications(false)
                  }
                  aria-label="Close notifications"
                >
                  ×
                </button>

              </div>


              <div className="notification-content">

                {notifications.length === 0 ? (

                  <div className="no-notifications">

                    <div className="no-notification-icon">
                      🔔
                    </div>

                    <h4>
                      No new notifications
                    </h4>

                    <p>
                      You're all caught up.
                    </p>

                  </div>

                ) : (

                  <div className="notification-list">

                    {notifications.map(
                      (notification) => (

                        <div
                          className="notification-item"
                          key={notification.id}
                        >

                          <div className="notification-item-icon">
                            {notification.icon || "🔔"}
                          </div>

                          <div className="notification-item-text">

                            <strong>
                              {notification.title}
                            </strong>

                            <p>
                              {notification.message}
                            </p>

                            <small>
                              {notification.time}
                            </small>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}

export default Header;