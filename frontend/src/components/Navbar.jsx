
import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import navLogo from "../../images/logos/nav logo.png";

function Navbar() {
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);

  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const dashboardMenuRef = useRef(null);

  const userRole = (
    localStorage.getItem("userRole") || ""
  ).trim().toLowerCase();

  const userName = localStorage.getItem("userName");

  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dashboardMenuRef.current &&
        !dashboardMenuRef.current.contains(event.target)
      ) {
        setDashboardMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setDashboardMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLink(event, path) {
    event.preventDefault();
    setDashboardMenuOpen(false);
    navigate(path);
  }

  function handleDashboardClick(path, requiredRole) {
    setDashboardMenuOpen(false);

    const token = localStorage.getItem("token");
    const currentRole = (
      localStorage.getItem("userRole") || ""
    ).trim().toLowerCase();

    if (!token || !currentRole) {
      navigate("/login");
      return;
    }

    if (currentRole !== requiredRole) {
      window.alert(
        `Dashboard access mismatch.\n\nYour saved role: ${
          currentRole || "not set"
        }\nRequired role: ${requiredRole}\n\nPlease log in with the correct account.`
      );
      return;
    }

    navigate(path);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    setDashboardMenuOpen(false);
    navigate("/login");
    window.location.reload();
  }

  return (
    <nav className="navbar" aria-label="Main navigation">
      <button
        type="button"
        className="navbar-logo"
        onClick={() => navigate("/")}
        aria-label="Khao To Jano home"
      >
        <img
          src={navLogo}
          alt="Khao To Jano — एक स्वाद की कहानी"
        />
      </button>

      <div className="navbar-links">
        <a href="/" onClick={(event) => handleLink(event, "/")}>
          Home
        </a>

        <a
          href="/restaurants"
          onClick={(event) => handleLink(event, "/restaurants")}
        >
          Restaurants
        </a>

        <a
          href="/our-story"
          onClick={(event) => handleLink(event, "/our-story")}
        >
          Our Story
        </a>

        <a
          href="/orders"
          onClick={(event) => handleLink(event, "/orders")}
        >
          My Orders
        </a>

        <a
          href="/register"
          onClick={(event) => handleLink(event, "/register")}
        >
          Create Account
        </a>

        <a
          href="/owner/register"
          onClick={(event) => handleLink(event, "/owner/register")}
        >
          Partner With Us
        </a>

        <div
          ref={dashboardMenuRef}
          className="dashboard-dropdown"
        >
          <button
            type="button"
            className="dashboard-dropdown-button"
            aria-haspopup="menu"
            aria-expanded={dashboardMenuOpen}
            onClick={() =>
              setDashboardMenuOpen((open) => !open)
            }
          >
            Dashboards {dashboardMenuOpen ? "▲" : "▼"}
          </button>

          {dashboardMenuOpen && (
            <div
              className="dashboard-dropdown-menu"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  handleDashboardClick(
                    "/customer/dashboard",
                    "customer"
                  )
                }
              >
                Customer Dashboard
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  handleDashboardClick(
                    "/restaurant/dashboard",
                    "restaurant_owner"
                  )
                }
              >
                Restaurant Dashboard
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  handleDashboardClick(
                    "/owner/dashboard",
                    "restaurant_owner"
                  )
                }
              >
                Owner Dashboard
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  handleDashboardClick(
                    "/admin/dashboard",
                    "admin"
                  )
                }
              >
                Admin Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          className="search-button"
          onClick={() => navigate("/restaurants")}
        >
          Search
        </button>

        <button
          type="button"
          className="cart-button"
          onClick={() => navigate("/cart")}
        >
          Cart ({cartCount})
        </button>

        {userRole ? (
          <button
            type="button"
            className="login-button"
            onClick={handleLogout}
          >
            Logout ({userName || "Account"})
          </button>
        ) : (
          <button
            type="button"
            className="login-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
