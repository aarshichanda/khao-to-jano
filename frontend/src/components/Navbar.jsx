
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import navLogo from "../../images/logos/nav logo.png";

function Navbar() {
  const navigate = useNavigate();

  const cartItems = useSelector((state) => state.cart.items);

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  function handleLink(event, path) {
    event.preventDefault();
    navigate(path);
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

        <button
          type="button"
          className="account-button"
          onClick={() => navigate("/login")}
        >
          Account
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
