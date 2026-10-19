
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [foodSearch, setFoodSearch] = useState("");

  function handleSearch(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (location.trim()) {
      params.set("location", location.trim());
    }

    if (foodSearch.trim()) {
      params.set("search", foodSearch.trim());
    }

    const query = params.toString();
    navigate(query ? `/restaurants?${query}` : "/restaurants");
  }

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-overlay" />

      <div className="hero-content">
        <p className="hero-tagline">एक स्वाद की कहानी</p>

        <h1 id="hero-title">
          Good Food
          <span>Closer to You.</span>
        </h1>

        <p className="hero-description">
          From fragrant biryani to your favourite Indian
          classics, discover delicious food from kitchens
          you will love.
        </p>

        <form className="hero-search" onSubmit={handleSearch}>
          <label className="hero-search-field">
            <span className="hero-field-icon" aria-hidden="true">
              ⌖
            </span>
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Enter your delivery location"
              aria-label="Enter your delivery location"
            />
          </label>

          <span className="hero-search-divider" aria-hidden="true" />

          <label className="hero-search-field hero-food-field">
            <span className="hero-field-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              value={foodSearch}
              onChange={(event) => setFoodSearch(event.target.value)}
              placeholder="Biryani, dosa, restaurants..."
              aria-label="Search food or restaurant"
            />
          </label>

          <button className="hero-search-button" type="submit">
            Find Food
          </button>
        </form>

        <div className="hero-benefits" aria-label="Our service benefits">
          <div className="hero-benefit">
            <span className="hero-benefit-icon" aria-hidden="true">↗</span>
            <span>
              <strong>Fast Delivery</strong>
              <small>At your doorstep</small>
            </span>
          </div>

          <div className="hero-benefit">
            <span className="hero-benefit-icon" aria-hidden="true">✦</span>
            <span>
              <strong>Wide Selection</strong>
              <small>Flavours for everyone</small>
            </span>
          </div>

          <div className="hero-benefit">
            <span className="hero-benefit-icon" aria-hidden="true">%</span>
            <span>
              <strong>Best Offers</strong>
              <small>More taste, less spend</small>
            </span>
          </div>

          <div className="hero-benefit">
            <span className="hero-benefit-icon" aria-hidden="true">✓</span>
            <span>
              <strong>Secure Payments</strong>
              <small>Checkout with confidence</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
